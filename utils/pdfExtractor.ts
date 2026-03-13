import pako from 'pako';
import { detectStatementYears } from './budgetHelpers';

const binaryStringToUint8Array = (binaryStr: string): Uint8Array => {
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i) & 0xff;
  }
  return bytes;
};

const decompressStream = (data: Uint8Array): string => {
  try {
    const decompressed = pako.inflate(data);
    let result = '';
    for (let i = 0; i < decompressed.length; i++) {
      result += String.fromCharCode(decompressed[i]);
    }
    return result;
  } catch {
    try {
      const decompressed = pako.inflateRaw(data);
      let result = '';
      for (let i = 0; i < decompressed.length; i++) {
        result += String.fromCharCode(decompressed[i]);
      }
      return result;
    } catch {
      return '';
    }
  }
};

const extractTextFromOperators = (content: string): string[] => {
  const lines: string[] = [];

  const tjRegex = /\[(.*?)\]\s*TJ/gs;
  let tjMatch;
  while ((tjMatch = tjRegex.exec(content)) !== null) {
    const inner = tjMatch[1];
    const parts = inner.match(/\(([^)]*)\)/g);
    if (parts) {
      const text = parts.map(p => p.slice(1, -1)).join('');
      if (text.trim()) lines.push(text.trim());
    }
  }

  const tdRegex = /\(([^)]+)\)\s*Tj/g;
  let tdMatch;
  while ((tdMatch = tdRegex.exec(content)) !== null) {
    const text = tdMatch[1].trim();
    if (text) lines.push(text);
  }

  return lines;
};

const extractBTBlocks = (raw: string): string[] => {
  const lines: string[] = [];
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];
    const extracted = extractTextFromOperators(block);
    lines.push(...extracted);
  }
  return lines;
};

const findAllStreams = (binaryStr: string): Uint8Array[] => {
  const streams: Uint8Array[] = [];
  const bytes = binaryStringToUint8Array(binaryStr);
  const streamMarker = [115, 116, 114, 101, 97, 109];
  const endMarker = [101, 110, 100, 115, 116, 114, 101, 97, 109];

  let i = 0;
  while (i < bytes.length - 10) {
    let found = true;
    for (let j = 0; j < streamMarker.length; j++) {
      if (bytes[i + j] !== streamMarker[j]) {
        found = false;
        break;
      }
    }

    if (found) {
      let start = i + streamMarker.length;
      if (bytes[start] === 13) start++;
      if (bytes[start] === 10) start++;

      let endPos = start;
      while (endPos < bytes.length - endMarker.length) {
        let endFound = true;
        for (let j = 0; j < endMarker.length; j++) {
          if (bytes[endPos + j] !== endMarker[j]) {
            endFound = false;
            break;
          }
        }
        if (endFound) break;
        endPos++;
      }

      if (endPos > start && endPos < bytes.length) {
        let actualEnd = endPos;
        if (actualEnd > start && bytes[actualEnd - 1] === 10) actualEnd--;
        if (actualEnd > start && bytes[actualEnd - 1] === 13) actualEnd--;
        
        if (actualEnd > start) {
          streams.push(bytes.slice(start, actualEnd));
        }
      }
      i = endPos + endMarker.length;
    } else {
      i++;
    }
  }

  return streams;
};

const decodeReadableText = (raw: string): string => {
  let result = '';
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code >= 32 && code <= 126) {
      result += raw[i];
    } else if (code === 10 || code === 13 || code === 9) {
      result += '\n';
    }
  }
  return result;
};

const hasValidLeadingDate = (line: string): boolean => {
  const match = line.match(/^\s{0,5}(\d{1,2})[/-](\d{1,2})([/-]\d{2,4})?\b/);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
};

const extractLeadingDate = (line: string): string | null => {
  const match = line.match(/^\s{0,5}((\d{1,2})[/-](\d{1,2})([/-]\d{2,4})?)\b/);
  if (!match) return null;
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return match[1];
};

const mergeFragmentedLines = (lines: string[]): string[] => {
  const merged: string[] = [];
  let currentLine = '';
  const amountPattern = /\$?\s*-?\d{1,3}(?:,\d{3})*(?:\.\d{2})\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (hasValidLeadingDate(line) && currentLine) {
      merged.push(currentLine.trim());
      currentLine = line;
    } else if (currentLine && amountPattern.test(line)) {
      currentLine += ' ' + line;
      merged.push(currentLine.trim());
      currentLine = '';
    } else if (hasValidLeadingDate(line)) {
      currentLine = line;
    } else if (currentLine) {
      currentLine += ' ' + line;
    } else {
      merged.push(line);
    }
  }

  if (currentLine) {
    merged.push(currentLine.trim());
  }

  return merged;
};

const isLikelyTransactionLine = (line: string): boolean => {
  const skipPatterns = [
    /\b(balance|opening|closing|beginning|ending|previous|statement|summary|page|total|account\s*(number|no|#)?)\b/i,
    /\b(routing|transit|acct|member)\s*(number|no|#|id)?\s*:?\s*\d/i,
    /\b(customer\s*service|phone|address|p\.?o\.?\s*box|www\.|http)/i,
    /\b(continued|page\s+\d|of\s+\d)/i,
    /^\s*page\s/i,
    /\bpage\s+\d+\s*(of|\/)/i,
    /^\s*\d{1,2}[/-]\d{1,2}\s*$/,
    /^\s*\d{1,2}[/-]\d{1,2}\s+\d{1,2}[/-]\d{1,2}\s*$/,
    /\b(annual|percentage|yield|rate|apy|apr)\b/i,
    /\b(fees?|service\s*charge|minimum|daily)\b.*\b(balance|ledger)\b/i,
    /\b(overdraft|nsf|returned|insufficient)\b/i,
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(line)) return false;
  }

  if (line.length < 10) return false;

  const letterCount = (line.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 3) return false;

  return true;
};

const findTransactionPatterns = (text: string): string[] => {
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const lines = mergeFragmentedLines(rawLines);
  const transactionLines: string[] = [];

  const amountPattern = /\$?\s*-?\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!isLikelyTransactionLine(line)) continue;

    if (hasValidLeadingDate(line) && amountPattern.test(line)) {
      transactionLines.push(line);
      continue;
    }

    if (hasValidLeadingDate(line) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (amountPattern.test(nextLine) && !hasValidLeadingDate(nextLine)) {
        const combined = line + ' ' + nextLine;
        if (isLikelyTransactionLine(combined)) {
          transactionLines.push(combined);
          i++;
          continue;
        }
      }
      if (i + 2 < lines.length) {
        const lineAfter = lines[i + 2];
        if (amountPattern.test(lineAfter) && !hasValidLeadingDate(nextLine)) {
          const combined = line + ' ' + nextLine + ' ' + lineAfter;
          if (isLikelyTransactionLine(combined)) {
            transactionLines.push(combined);
            i += 2;
            continue;
          }
        }
      }
      if (i + 3 < lines.length) {
        const combined = line + ' ' + nextLine + ' ' + lines[i + 2] + ' ' + lines[i + 3];
        if (amountPattern.test(combined) && isLikelyTransactionLine(combined)) {
          transactionLines.push(combined);
          i += 3;
          continue;
        }
      }
    }
  }

  console.log('findTransactionPatterns: found', transactionLines.length, 'lines from', lines.length, 'total');
  return transactionLines;
};

const buildCSVFromTransactions = (transactionLines: string[], statementYears?: number[]): string => {
  const csvRows: string[] = statementYears && statementYears.length > 0
    ? [`# Statement Years: ${statementYears.join(' ')}`, 'Date,Description,Amount']
    : ['Date,Description,Amount'];
  const datePatternBroad = /\b(\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?)\b/;
  const amountPattern = /(-?\$?\s*-?\d{1,3}(?:,\d{3})*\.\d{2})\b/g;

  for (const line of transactionLines) {
    const leadingDate = extractLeadingDate(line);
    const dateMatch = leadingDate ? [leadingDate, leadingDate] : line.match(datePatternBroad);
    if (!dateMatch) continue;

    const date = leadingDate || dateMatch[1];
    const amounts: string[] = [];
    let amtMatch;
    while ((amtMatch = amountPattern.exec(line)) !== null) {
      amounts.push(amtMatch[1].replace(/[$,\s]/g, ''));
    }
    amountPattern.lastIndex = 0;

    if (amounts.length === 0) continue;

    let desc = line;
    desc = desc.replace(datePatternBroad, '').trim();
    desc = desc.replace(/(-?\$?\s*-?\d{1,3}(?:,\d{3})*\.\d{2})/g, '').trim();
    desc = desc.replace(/\s{2,}/g, ' ').trim();

    const amount = amounts[0];

    if (amount) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || Math.abs(amountNum) > 999999) continue;

      const finalDesc = desc || 'Transaction';
      if (finalDesc.length < 2) continue;

      csvRows.push(`${date},"${finalDesc}",${amount}`);
    }
  }

  console.log('buildCSVFromTransactions: built', csvRows.length - 1, 'CSV rows from', transactionLines.length, 'lines');
  return csvRows.join('\n');
};

export const extractTextFromPDF = (binaryString: string): string => {
  console.log('PDF extractor: starting, binary length:', binaryString.length);

  const allTextLines: string[] = [];

  const streams = findAllStreams(binaryString);
  console.log('PDF extractor: found', streams.length, 'stream objects');

  let decompressedCount = 0;
  for (const streamData of streams) {
    const decompressed = decompressStream(streamData);
    if (decompressed && decompressed.length > 0) {
      decompressedCount++;
      const textFromBT = extractBTBlocks(decompressed);
      if (textFromBT.length > 0) {
        allTextLines.push(...textFromBT);
      } else {
        const textFromOps = extractTextFromOperators(decompressed);
        if (textFromOps.length > 0) {
          allTextLines.push(...textFromOps);
        }
      }
    }
  }
  console.log('PDF extractor: decompressed', decompressedCount, 'streams, got', allTextLines.length, 'text lines');

  const readableText = decodeReadableText(binaryString);
  const uncompressedBT = extractBTBlocks(readableText);
  if (uncompressedBT.length > 0) {
    console.log('PDF extractor: found', uncompressedBT.length, 'lines from uncompressed BT blocks');
    allTextLines.push(...uncompressedBT);
  }

  const uncompressedOps = extractTextFromOperators(readableText);
  if (uncompressedOps.length > 0) {
    console.log('PDF extractor: found', uncompressedOps.length, 'lines from uncompressed operators');
    allTextLines.push(...uncompressedOps);
  }

  const uniqueLines = [...new Set(allTextLines)];
  console.log('PDF extractor: total unique text lines:', uniqueLines.length);

  if (uniqueLines.length > 0) {
    const fullText = uniqueLines.join('\n');
    console.log('PDF extractor: full extracted text preview:', fullText.substring(0, 500));

    let detectedYears = detectStatementYears(fullText);
    if (detectedYears.length === 0) detectedYears = detectStatementYears(readableText);
    console.log('PDF extractor: detected statement years:', detectedYears);

    const transactionLines = findTransactionPatterns(fullText);
    console.log('PDF extractor: found', transactionLines.length, 'transaction-like lines');

    if (transactionLines.length > 0) {
      const csv = buildCSVFromTransactions(transactionLines, detectedYears);
      const rowCount = csv.split('\n').length - 1;
      console.log('PDF extractor: built CSV with', rowCount, 'rows');
      return csv;
    }

    return fullText;
  }

  const directLines = findTransactionPatterns(readableText);
  if (directLines.length > 0) {
    const detectedYears2 = detectStatementYears(readableText);
    console.log('PDF extractor: found', directLines.length, 'transactions from raw text');
    return buildCSVFromTransactions(directLines, detectedYears2);
  }

  console.log('PDF extractor: no structured text found, returning raw readable lines');
  const readableLines = readableText.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 3 && /[a-zA-Z]/.test(l) && !/^[%</]/.test(l));

  return readableLines.join('\n');
};

export const isPDFContent = (content: string): boolean => {
  return content.substring(0, 10).includes('%PDF');
};
