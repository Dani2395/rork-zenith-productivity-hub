const decodeStream = (raw: string): string => {
  try {
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
  } catch {
    return raw;
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

const extractBetweenMarkers = (raw: string): string[] => {
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

const findTransactionPatterns = (text: string): string[] => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const transactionLines: string[] = [];

  const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/;
  const amountPattern = /\$?\s*-?\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (datePattern.test(line) && amountPattern.test(line)) {
      transactionLines.push(line);
    }
  }

  return transactionLines;
};

const buildCSVFromTransactions = (transactionLines: string[]): string => {
  const csvRows: string[] = ['Date,Description,Amount'];
  const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/;
  const amountPattern = /(-?\$?\s*-?\d{1,3}(?:,\d{3})*\.\d{2})\b/g;

  for (const line of transactionLines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    const date = dateMatch[1];
    const amounts: string[] = [];
    let amtMatch;
    while ((amtMatch = amountPattern.exec(line)) !== null) {
      amounts.push(amtMatch[1].replace(/[\$,\s]/g, ''));
    }
    amountPattern.lastIndex = 0;

    if (amounts.length === 0) continue;

    let desc = line;
    desc = desc.replace(datePattern, '').trim();
    desc = desc.replace(/(-?\$?\s*-?\d{1,3}(?:,\d{3})*\.\d{2})/g, '').trim();
    desc = desc.replace(/\s{2,}/g, ' ').trim();

    const amount = amounts[amounts.length - 1];

    if (desc && amount) {
      csvRows.push(`${date},"${desc}",${amount}`);
    }
  }

  return csvRows.join('\n');
};

export const extractTextFromPDF = (binaryString: string): string => {
  console.log('PDF extractor: starting, binary length:', binaryString.length);

  const decoded = decodeStream(binaryString);
  const textLines = extractBetweenMarkers(decoded);
  console.log('PDF extractor: extracted', textLines.length, 'text segments from BT/ET blocks');

  if (textLines.length > 0) {
    const fullText = textLines.join('\n');
    const transactionLines = findTransactionPatterns(fullText);
    console.log('PDF extractor: found', transactionLines.length, 'transaction-like lines');

    if (transactionLines.length > 0) {
      const csv = buildCSVFromTransactions(transactionLines);
      console.log('PDF extractor: built CSV with', csv.split('\n').length - 1, 'rows');
      return csv;
    }

    return fullText;
  }

  const streamRegex = /stream\s*\n?([\s\S]*?)\n?endstream/g;
  const allText: string[] = [];
  let streamMatch;
  while ((streamMatch = streamRegex.exec(decoded)) !== null) {
    const streamContent = streamMatch[1];
    const textFromStream = extractTextFromOperators(streamContent);
    allText.push(...textFromStream);
  }
  console.log('PDF extractor: extracted', allText.length, 'text segments from streams');

  if (allText.length > 0) {
    const fullText = allText.join('\n');
    const transactionLines = findTransactionPatterns(fullText);

    if (transactionLines.length > 0) {
      return buildCSVFromTransactions(transactionLines);
    }
    return fullText;
  }

  const directLines = findTransactionPatterns(decoded);
  if (directLines.length > 0) {
    console.log('PDF extractor: found', directLines.length, 'transactions from raw text');
    return buildCSVFromTransactions(directLines);
  }

  console.log('PDF extractor: no structured text found, returning raw readable text');
  const readableLines = decoded.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 3 && /[a-zA-Z]/.test(l) && !/^[%<\/]/.test(l));

  return readableLines.join('\n');
};

export const isPDFContent = (content: string): boolean => {
  return content.substring(0, 10).includes('%PDF');
};
