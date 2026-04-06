import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Brain, X, ChevronDown, Check, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type TimeTag = 'today' | 'tomorrow' | 'this-week' | 'future';

const TIME_TAGS: { key: TimeTag; label: string; color: string }[] = [
  { key: 'today',     label: 'TODAY',     color: '#ef4444' },
  { key: 'tomorrow',  label: 'TOMORROW',  color: '#f59e0b' },
  { key: 'this-week', label: 'THIS WEEK', color: '#6366f1' },
  { key: 'future',    label: 'FUTURE',    color: '#6b7280' },
];

interface ExtractedItem {
  id: string;
  text: string;
  tag: TimeTag;
}

// ─── Extraction Logic ─────────────────────────────────────────────────────────

const ACTION_PATTERNS = [
  /^(?:i need to|i have to|i should|i must|i want to|i gotta|i've got to|need to|have to|should|must)\s+(.+)/i,
  /^(?:don't forget to|remember to|remind me to|make sure to)\s+(.+)/i,
  /^(?:call|email|text|message|contact|reach out to)\s+(.+)/i,
  /^(?:buy|get|pick up|order|purchase)\s+(.+)/i,
  /^(?:schedule|book|plan|arrange|set up)\s+(.+)/i,
  /^(?:fix|repair|update|upgrade|change|replace)\s+(.+)/i,
  /^(?:finish|complete|submit|send|deliver)\s+(.+)/i,
  /^(?:check|review|look at|look into|research|find out)\s+(.+)/i,
  /^(?:pay|transfer|invoice)\s+(.+)/i,
  /^(?:make|create|build|write|draft)\s+(.+)/i,
  /^(?:talk to|speak with|meet with|ask)\s+(.+)/i,
  /^(?:clean|organize|sort|declutter)\s+(.+)/i,
  /^(?:exercise|workout|run|go to)\s+(.+)/i,
  /^(?:return|exchange|cancel|renew)\s+(.+)/i,
  /^(?:follow up|follow-up)\s+(.+)/i,
];

function detectTag(sentence: string): TimeTag {
  const s = sentence.toLowerCase();
  if (/\b(today|tonight|this morning|this afternoon|this evening|asap|urgent|right away|immediately|right now)\b/.test(s)) {
    return 'today';
  }
  if (/\b(tomorrow|tmrw|next day|tomorrow morning|tomorrow night)\b/.test(s)) {
    return 'tomorrow';
  }
  if (/\b(this week|later this week|by friday|by the weekend|in a few days|soon|this weekend)\b/.test(s)) {
    return 'this-week';
  }
  if (/\b(next week|next month|eventually|someday|one day|in the future|later|at some point|down the road|when i get a chance)\b/.test(s)) {
    return 'future';
  }
  // Default: this week
  return 'this-week';
}

function extractActionableItems(rawText: string): ExtractedItem[] {
  // Split on sentence-ending punctuation or newlines
  const sentences = rawText
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 4);

  const items: ExtractedItem[] = [];
  const seen = new Set<string>();

  sentences.forEach((sentence, idx) => {
    let actionText: string | null = null;

    for (const pattern of ACTION_PATTERNS) {
      const match = sentence.match(pattern);
      if (match) {
        // If pattern captures the remainder, use it; otherwise use full sentence
        actionText = match[1] ? capitalise(match[1].trim()) : capitalise(sentence.trim());
        break;
      }
    }

    if (actionText && !seen.has(actionText.toLowerCase())) {
      seen.add(actionText.toLowerCase());
      items.push({
        id: `${idx}-${Date.now()}`,
        text: actionText,
        tag: detectTag(sentence),
      });
    }
  });

  return items;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function nextTag(current: TimeTag): TimeTag {
  const order: TimeTag[] = ['today', 'tomorrow', 'this-week', 'future'];
  return order[(order.indexOf(current) + 1) % order.length];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BrainDumpScreen() {
  const router = useRouter();
  const { addNote, addTask } = useData();

  const [phase, setPhase] = useState<'write' | 'review' | 'done'>('write');
  const [rawText, setRawText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [items, setItems] = useState<ExtractedItem[]>([]);

  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

  // ── Process ──────────────────────────────────────────────────────────────

  const handleProcess = () => {
    if (!rawText.trim()) {
      Alert.alert('Nothing to process', 'Write something first.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessing(true);

    // Small delay so the loader is visible
    setTimeout(() => {
      const extracted = extractActionableItems(rawText);
      setItems(extracted);
      setProcessing(false);
      setPhase('review');
    }, 600);
  };

  // ── Tag cycling ──────────────────────────────────────────────────────────

  const handleCycleTag = (id: string) => {
    Haptics.selectionAsync();
    setItems(prev =>
      prev.map(item => item.id === id ? { ...item, tag: nextTag(item.tag) } : item)
    );
  };

  // ── Delete item ──────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // ── Confirm ──────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Save raw text as a journal note
    addNote({
      name: `Brain Dump — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      text: rawText,
      locked: false,
      pinned: false,
      date: today,
      category: 'journal',
      createdDate: today,
    } as any);

    // Add each item as a task
    items.forEach(item => {
      let taskDate = '';
      if (item.tag === 'today') taskDate = today;
      else if (item.tag === 'tomorrow') taskDate = tomorrow;

      addTask({
        name: item.text,
        desc: '',
        priority: item.tag === 'today' ? 'high' : item.tag === 'tomorrow' ? 'medium' : 'low',
        date: taskDate,
        time: '',
        recurring: 'none',
        completed: false,
        listId: null,
        category: '',
        createdDate: today,
      } as any);
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('done');

    setTimeout(() => router.back(), 1400);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (phase === 'done') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneContainer}>
          <Check size={52} color={Colors.success} />
          <Text style={styles.doneTitle}>All done!</Text>
          <Text style={styles.doneSub}>Journal saved · Tasks added</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Write phase ───────────────────────────────────────────────────────────

  if (phase === 'write') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Brain size={20} color={Colors.secondary} />
              <Text style={styles.headerTitle}>Brain Dump</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Colors.textDim} />
            </TouchableOpacity>
          </View>

          <Text style={styles.prompt}>
            What's on your mind? Just let it all out — don't filter, don't edit.
          </Text>

          {/* Text area */}
          <TextInput
            style={styles.textArea}
            multiline
            autoFocus
            placeholder="I need to call the dentist… pick up groceries today… should finally fix the wifi router… finish that report by Friday…"
            placeholderTextColor="#3a3a4a"
            value={rawText}
            onChangeText={setRawText}
            textAlignVertical="top"
            scrollEnabled
          />

          {/* Footer */}
          <View style={styles.writeFooter}>
            <Text style={styles.wordCount}>{wordCount} {wordCount === 1 ? 'word' : 'words'}</Text>
            <TouchableOpacity
              style={[styles.processBtn, !rawText.trim() && styles.processBtnDisabled]}
              onPress={handleProcess}
              disabled={!rawText.trim() || processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.processBtnText}>Extract Tasks →</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Review phase ──────────────────────────────────────────────────────────

  const grouped = TIME_TAGS.map(tag => ({
    ...tag,
    items: items.filter(i => i.tag === tag.key),
  })).filter(g => g.items.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Brain size={20} color={Colors.secondary} />
          <Text style={styles.headerTitle}>Review Tasks</Text>
        </View>
        <TouchableOpacity
          onPress={() => setPhase('write')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editLink}>← Edit</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.reviewHint}>
        Tap a tag to change when it belongs. Trash to remove.
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {grouped.length === 0 ? (
          <View style={styles.emptyReview}>
            <Text style={styles.emptyReviewText}>
              No actionable items found.{'\n'}Go back and be more specific — e.g. "I need to…" or "Call…"
            </Text>
          </View>
        ) : (
          grouped.map(group => (
            <View key={group.key} style={styles.group}>
              <Text style={[styles.groupLabel, { color: group.color }]}>{group.label}</Text>
              {group.items.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <TouchableOpacity
                    style={[styles.tagBadge, { backgroundColor: group.color + '22', borderColor: group.color + '66' }]}
                    onPress={() => handleCycleTag(item.id)}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text style={[styles.tagBadgeText, { color: group.color }]}>{group.label}</Text>
                    <ChevronDown size={10} color={group.color} style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                  <Text style={styles.itemText} numberOfLines={2}>{item.text}</Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={15} color="#3a3a4a" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Confirm */}
      <View style={styles.confirmFooter}>
        <Text style={styles.confirmMeta}>
          {items.length} task{items.length !== 1 ? 's' : ''} · journal entry saved
        </Text>
        <TouchableOpacity
          style={[styles.confirmBtn, items.length === 0 && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={items.length === 0}
        >
          <Check size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.confirmBtnText}>Add to Tasks</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  editLink: {
    fontSize: 14,
    color: Colors.primary,
  },

  // Write phase
  prompt: {
    fontSize: 13,
    color: Colors.textDim,
    paddingHorizontal: 20,
    marginBottom: 14,
    lineHeight: 19,
  },
  textArea: {
    flex: 1,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#0f0f18',
    color: Colors.text,
    fontSize: 15,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)',
  },
  writeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  wordCount: {
    fontSize: 12,
    color: Colors.textDim,
  },
  processBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  processBtnDisabled: {
    opacity: 0.4,
  },
  processBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Review phase
  reviewHint: {
    fontSize: 12,
    color: Colors.textDim,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  group: {
    marginHorizontal: 16,
    marginBottom: 18,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingLeft: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  emptyReview: {
    paddingTop: 40,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyReviewText: {
    color: Colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Confirm footer
  confirmFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmMeta: {
    fontSize: 12,
    color: Colors.textDim,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Done
  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
  },
  doneSub: {
    fontSize: 14,
    color: Colors.textDim,
  },
});
