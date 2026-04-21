import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface Props {
  content: string;
}

type Block =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'hr' }
  | { type: 'ul'; text: string }
  | { type: 'ol'; text: string; index: number }
  | { type: 'code'; text: string }
  | { type: 'p'; text: string }
  | { type: 'blank' };

function parseBlocks(raw: string): Block[] {
  const lines = raw.split('\n');
  const blocks: Block[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let olIndex = 0;

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', text: codeLines.join('\n') });
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.trim() === '' || line.trim() === '---' || line.trim() === '***') {
      if (line.trim() === '---') { blocks.push({ type: 'hr' }); olIndex = 0; continue; }
      blocks.push({ type: 'blank' }); olIndex = 0; continue;
    }
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.slice(4) }); olIndex = 0; continue; }
    if (line.startsWith('## ')) { blocks.push({ type: 'h2', text: line.slice(3) }); olIndex = 0; continue; }
    if (line.startsWith('# ')) { blocks.push({ type: 'h1', text: line.slice(2) }); olIndex = 0; continue; }
    if (/^[-*] /.test(line)) { blocks.push({ type: 'ul', text: line.slice(2) }); olIndex = 0; continue; }
    if (/^\d+\. /.test(line)) {
      olIndex++;
      blocks.push({ type: 'ol', text: line.replace(/^\d+\. /, ''), index: olIndex });
      continue;
    }
    olIndex = 0;
    blocks.push({ type: 'p', text: line });
  }
  if (inCode && codeLines.length) blocks.push({ type: 'code', text: codeLines.join('\n') });
  return blocks;
}

function InlineText({ text }: { text: string }) {
  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <Text>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <Text key={i} style={md.bold}>{part.slice(2, -2)}</Text>;
        if (part.startsWith('*') && part.endsWith('*'))
          return <Text key={i} style={md.italic}>{part.slice(1, -1)}</Text>;
        if (part.startsWith('`') && part.endsWith('`'))
          return <Text key={i} style={md.inlineCode}>{part.slice(1, -1)}</Text>;
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

export default function MarkdownRenderer({ content }: Props) {
  const blocks = parseBlocks(content);

  return (
    <View style={md.container}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h1': return <Text key={i} style={md.h1}><InlineText text={block.text} /></Text>;
          case 'h2': return <Text key={i} style={md.h2}><InlineText text={block.text} /></Text>;
          case 'h3': return <Text key={i} style={md.h3}><InlineText text={block.text} /></Text>;
          case 'hr': return <View key={i} style={md.hr} />;
          case 'blank': return <View key={i} style={{ height: 8 }} />;
          case 'ul': return (
            <View key={i} style={md.listRow}>
              <Text style={md.bullet}>•</Text>
              <Text style={md.listText}><InlineText text={block.text} /></Text>
            </View>
          );
          case 'ol': return (
            <View key={i} style={md.listRow}>
              <Text style={md.bullet}>{block.index}.</Text>
              <Text style={md.listText}><InlineText text={block.text} /></Text>
            </View>
          );
          case 'code': return (
            <View key={i} style={md.codeBlock}>
              <Text style={md.codeText}>{block.text}</Text>
            </View>
          );
          case 'p': return (
            <Text key={i} style={md.p}><InlineText text={block.text} /></Text>
          );
        }
      })}
    </View>
  );
}

const md = StyleSheet.create({
  container: { gap: 2 },
  h1: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 8, marginBottom: 4 },
  h2: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 6, marginBottom: 2 },
  h3: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 4, marginBottom: 2 },
  p: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: Colors.primary,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  bullet: { fontSize: 14, color: Colors.textDim, marginRight: 8, lineHeight: 22 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 8 },
  listText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 22 },
  hr: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  codeBlock: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 18,
  },
});
