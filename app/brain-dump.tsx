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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Brain, X, ChevronDown, Check, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import { updateBrainDumpWidget, BRAIN_DUMP_WIDGET_DATA_KEY } from '@/widgets/widgetTaskHandler';

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

// Sentences that mention these topics get a synthesized task name instead of
// verbatim text. Format: [matchPattern, actionVerb, subjectNoun]
// If subjectNoun is '', the action verb alone is used (caller handles extras).
const TOPIC_MAP: [RegExp, string, string][] = [
  // Health / appointments
  [/dentist|dental|teeth|orthodontist|braces/i,                    'Schedule', 'dentist appointment'],
  [/doctor|physician|check.?up|physical|annual exam/i,             'Schedule', 'doctor appointment'],
  [/therapist|therapy|counseling|mental health|psychiatrist/i,     'Schedule', 'therapy appointment'],
  [/vet|veterinarian/i,                                            'Schedule', 'vet appointment'],
  [/hair\s*cut|barber|salon/i,                                     'Get',      'haircut'],
  [/prescription|pharmacy|medication/i,                            'Pick up',  'prescription'],
  [/eye\s*(doctor|exam|glass)/i,                                   'Schedule', 'eye exam'],

  // Moving / housing
  [/\bmov(e|ing|ed)\b|relocation/i,                                'Plan',     'move'],
  [/\bpack(ing|ed|s)?\b/i,                                         'Start',    'packing'],
  [/\bunpack/i,                                                     'Unpack',   'boxes'],
  [/apartment\s*hunt|house\s*hunt|new\s*(place|home|apartment)/i,  'Research', 'housing options'],

  // Car / transport
  [/oil\s*change/i,                                                'Get',      'oil change'],
  [/car\s*(service|repair|fix|noise|issue|problem|inspect)/i,      'Take car to', 'mechanic'],
  [/tire(s)?\b/i,                                                  'Check',    'tires'],
  [/registration|dmv/i,                                            'Renew',    'car registration'],
  [/car\s*wash/i,                                                  'Wash',     'car'],

  // Finance / admin
  [/\btax(es|return)?\b/i,                                         'File',     'taxes'],
  [/\bbudget\b|finances|spending plan/i,                           'Review',   'budget'],
  [/\bbills?\b|utilities|electric|water\s*bill|internet\s*bill/i,  'Pay',      'bills'],
  [/credit\s*card/i,                                               'Pay',      'credit card'],
  [/invest(ment|ing)?|\b401k\b|\bira\b|savings\s*account/i,        'Review',   'investments'],
  [/insurance/i,                                                   'Review',   'insurance'],
  [/passport|visa\b/i,                                             'Renew',    'passport'],

  // Work / career
  [/\bresume\b|\bcv\b/i,                                           'Update',   'resume'],
  [/\binterview\b/i,                                               'Prepare for', 'interview'],
  [/job\s*(search|application|apply|hunting)/i,                    'Apply for', 'jobs'],
  [/\bdeadline\b/i,                                                'Meet',     'deadline'],
  [/\bmeeting\b/i,                                                 'Prepare for', 'meeting'],
  [/\bpresentation\b/i,                                            'Prepare',  'presentation'],
  [/\breport\b/i,                                                  'Write',    'report'],
  [/follow.?up/i,                                                  'Follow up', ''],

  // Home / chores
  [/\bgroceries\b|grocery\s*store|supermarket/i,                   'Buy',      'groceries'],
  [/\blaundry\b|washing\s*clothes/i,                               'Do',       'laundry'],
  [/clean(ing)?\s*(house|home|apartment|room|bathroom|kitchen)/i,  'Clean',    'home'],
  [/\bdishes\b|wash\s*the\s*sink/i,                                'Do',       'dishes'],
  [/\bvacuum\b/i,                                                  'Vacuum',   'home'],
  [/meal\s*prep|cook\s*(for|the)\s*week/i,                         'Meal prep', 'for the week'],
  [/\bdeclutter\b|organiz(e|ing)\s*(closet|garage|room)/i,         'Declutter', ''],

  // Health / fitness
  [/\bgym\b|work.?out|exercise|training\s*session/i,               'Go to',    'gym'],
  [/\b(go\s*for\s*a\s*)?run\b|jogging/i,                           'Go for',   'run'],
  [/\bmeditat/i,                                                    'Start',    'meditation habit'],
  [/sleep\s*(schedule|routine|better|issues)/i,                    'Fix',      'sleep schedule'],

  // Social / family
  [/\bbirthday\b/i,                                                'Plan for', 'birthday'],
  [/\bwedding\b/i,                                                 'Plan for', 'wedding'],
  [/\bparty\b|\bevent\b|\bcelebration\b/i,                         'Plan',     'event'],
  [/\bgift\b|\bpresent\b/i,                                        'Buy',      'gift'],

  // Personal growth
  [/\btrip\b|\bvacation\b|\btravel\b/i,                            'Plan',     'trip'],
  [/\bcourse\b|\bclass\b|online\s*learn/i,                         'Start',    'online course'],
  [/\bjournal\b/i,                                                 'Start',    'journaling habit'],
];

// Leading filler phrases to strip so we can work with the core clause
const LEADING_FILLERS = [
  /^i('ve)?\s+been\s+(putting\s+off|meaning\s+to|trying\s+to|avoiding|procrastinating\s+(on|about)?)\s*/i,
  /^i('m| am)\s+(so\s+)?(stressed|worried|anxious|overwhelmed|concerned|freaking\s+out)\s*(about|over|regarding|with)?\s*/i,
  /^i\s+(need|have|want|should|must|gotta|ought)\s+(to\s+)?/i,
  /^i\s+(keep|always|never|constantly)\s+(forgetting|putting\s+off|avoiding)\s*(to\s+)?/i,
  /^i('ve)?\s+(haven't|have\s+not)\s+(done|finished|started|gotten)\s*(around\s+to\s+)?/i,
  /^(don't\s+forget\s+(to\s+)?|remember\s+(to\s+)?|remind\s+me\s+(to\s+)?|make\s+sure\s+(to\s+)?)/i,
  /^(need\s+to|have\s+to|got\s+to|gotta)\s+/i,
  /^(should|must|ought\s+to)\s+/i,
  /^(really\s+should|really\s+need\s+to|definitely\s+(need|should|have)\s+(to\s+)?)/i,
];

// Trailing noise to chop off
const TRAILING_NOISE = [
  /\s*(because|since|as\s+it|so\s+that|in\s+order\s+to|although|even\s+though|which\s+(is|would|could|has))\s+.*/i,
  /\s*(but\s+i|and\s+i\s+(also|just|really))\s+.*/i,
  /\s*(for\s+the\s+(last|past)\s+\w+(\s+\w+)?)\s*$/i,
  /\s*(it('s|\s+has\s+been)\s+(really|so|very|quite)\s+\w+)\s*$/i,
  /,\s*(which|that|it|they)\s+.*/i,
];

function stripFiller(sentence: string): string {
  let s = sentence.trim();
  // Remove leading fillers (try each; stop after first match to avoid over-stripping)
  for (const re of LEADING_FILLERS) {
    const stripped = s.replace(re, '');
    if (stripped.length >= 4 && stripped.length < s.length) {
      s = stripped;
      break;
    }
  }
  // Remove trailing noise clauses
  for (const re of TRAILING_NOISE) {
    s = s.replace(re, '');
  }
  return s.trim();
}

function synthesizeTaskName(sentence: string): string | null {
  const lower = sentence.toLowerCase();

  // 1. Try topic map — gives cleanest results
  for (const [pattern, action, subject] of TOPIC_MAP) {
    if (pattern.test(lower)) {
      return subject ? `${action} ${subject}` : action;
    }
  }

  // 2. "call/email/text [Name]" — extract the name
  const callMatch = sentence.match(/^(?:call|phone|ring|email|text|message|contact)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (callMatch) {
    const verb = /email/i.test(sentence) ? 'Email' : /text|message/i.test(sentence) ? 'Text' : 'Call';
    return `${verb} ${callMatch[1]}`;
  }
  const callMatch2 = sentence.match(/(?:i need to|i should|need to)\s+(call|email|text|message)\s+([A-Za-z]+)/i);
  if (callMatch2) {
    const verb = /email/i.test(callMatch2[1]) ? 'Email' : /text|message/i.test(callMatch2[1]) ? 'Text' : 'Call';
    return `${verb} ${capitalise(callMatch2[2])}`;
  }

  // 3. Strip filler and use what remains — if it's short enough to be a task
  const core = stripFiller(sentence);
  if (core.length >= 5 && core.length <= 45) {
    return toTitleCase(core);
  }

  // 4. Nothing usable
  return null;
}

function isActionable(sentence: string): boolean {
  const s = sentence.toLowerCase();
  return (
    // Explicit intent signals
    /\b(need to|have to|should|must|gotta|want to|going to)\b/.test(s) ||
    // Stress / worry about something → implies action needed
    /\b(stressed|worried|anxious|overwhelmed|concerned)\s+(about|over|with|regarding)\b/.test(s) ||
    // Procrastination signals
    /\b(keep forgetting|been putting off|haven't done|haven't gotten|meaning to|been avoiding)\b/.test(s) ||
    // Direct imperatives (call, buy, fix, etc.)
    /^(call|email|text|buy|get|pick up|order|schedule|fix|finish|complete|submit|pay|plan|clean|write|make|check|review|book|start|return|cancel|renew|follow up|find)\b/.test(s) ||
    // Reminder language
    /\b(don't forget|remember to|remind me|make sure)\b/.test(s) ||
    // Topic map hit is automatically actionable (checked separately)
    TOPIC_MAP.some(([p]) => p.test(s))
  );
}

function detectTag(sentence: string): TimeTag {
  const s = sentence.toLowerCase();
  if (/\b(today|tonight|this morning|this afternoon|this evening|asap|urgent|right away|immediately|right now)\b/.test(s)) return 'today';
  if (/\b(tomorrow|tmrw|next day|tomorrow morning|tomorrow night)\b/.test(s)) return 'tomorrow';
  if (/\b(this week|later this week|by friday|by the weekend|in a few days|soon|this weekend)\b/.test(s)) return 'this-week';
  if (/\b(next week|next month|eventually|someday|one day|in the future|later|at some point|down the road|when i get a chance)\b/.test(s)) return 'future';
  return 'this-week';
}

function extractActionableItems(rawText: string): ExtractedItem[] {
  const sentences = rawText
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 4);

  const items: ExtractedItem[] = [];
  const seen = new Set<string>();

  sentences.forEach((sentence, idx) => {
    if (!isActionable(sentence)) return;

    const taskName = synthesizeTaskName(sentence);
    if (!taskName) return;

    const key = taskName.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    items.push({
      id: `${idx}-${Date.now()}`,
      text: taskName,
      tag: detectTag(sentence),
    });
  });

  return items;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toTitleCase(s: string): string {
  const SMALL = new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is']);
  return s
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i === 0 || !SMALL.has(w)) ? capitalise(w) : w)
    .join(' ');
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

    // Update the home-screen widget
    AsyncStorage.getItem(BRAIN_DUMP_WIDGET_DATA_KEY).then(raw => {
      const prev = raw ? JSON.parse(raw) : { totalDumps: 0 };
      updateBrainDumpWidget({
        lastDumpDate: today,
        lastDumpPreview: rawText.replace(/\n/g, ' ').slice(0, 100),
        lastDumpTaskCount: items.length,
        totalDumps: (prev.totalDumps ?? 0) + 1,
      });
    }).catch(() => {
      updateBrainDumpWidget({
        lastDumpDate: today,
        lastDumpPreview: rawText.replace(/\n/g, ' ').slice(0, 100),
        lastDumpTaskCount: items.length,
        totalDumps: 1,
      });
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
