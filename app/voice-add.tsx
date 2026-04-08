/**
 * Voice / AI Quick-Add screen
 *
 * Opened three ways:
 *  1. Tapping "Voice Command" in the home Quick Access menu
 *  2. Deep link: rork-app:///voice-add?cmd=add+task+buy+milk
 *  3. Direct URL with pre-split params: rork-app:///voice-add?type=task&name=buy+milk&priority=high
 *
 * Google Assistant setup:
 *   Create a Google Assistant routine → Add action → "Open app" → choose Zenith
 *   Android: in advanced options paste  rork-app:///voice-add?cmd=add+task+YOURTEXT
 *   (For fully dynamic voice → app routing, see the in-app setup guide below.)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Mic, CheckCircle2, X, ChevronDown, ChevronUp, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import { parseCommand, describeCommand, ParsedCommand } from '@/utils/nlpParser';

const EXAMPLE_COMMANDS = [
  'add task buy groceries tomorrow',
  'remind me to call the dentist at 9am',
  'note ideas for the weekend trip',
  'add priority finish project report high priority',
  'schedule team meeting next monday at 2pm',
  'add task pay bills low priority',
];

const TYPE_COLORS: Record<string, string> = {
  task: Colors.primary,
  note: Colors.success,
  priority: Colors.warning,
  event: Colors.secondary,
  unknown: Colors.textDim,
};

const TYPE_LABELS: Record<string, string> = {
  task: '✅ Task',
  note: '📝 Note',
  priority: '🔥 Top Priority',
  event: '📅 Event',
  unknown: '❓ Item',
};

export default function VoiceAddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cmd?: string; type?: string; name?: string; priority?: string; date?: string; time?: string }>();
  const { addTask, addNote, addPriority, tasks } = useData();
  const today = new Date().toISOString().split('T')[0];

  const [command, setCommand] = useState(params.cmd ?? '');
  const [parsed, setParsed] = useState<ParsedCommand | null>(null);
  const [done, setDone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const successAnim = useRef(new Animated.Value(0)).current;

  // Parse whenever command changes (with debounce)
  useEffect(() => {
    if (!command.trim()) { setParsed(null); return; }
    const t = setTimeout(() => setParsed(parseCommand(command)), 300);
    return () => clearTimeout(t);
  }, [command]);

  // If opened with pre-split params (e.g. from a direct deep link bypassing NLP)
  useEffect(() => {
    if (params.name && !params.cmd) {
      const synthetic: ParsedCommand = {
        type: (params.type as any) ?? 'task',
        name: params.name,
        date: params.date,
        time: params.time,
        priority: (params.priority as any) ?? 'medium',
      };
      setParsed(synthetic);
    }
  }, []);

  const handleCreate = () => {
    if (!parsed || !parsed.name.trim()) return;

    if (parsed.type === 'task' || parsed.type === 'unknown') {
      addTask({
        name: parsed.name,
        desc: '',
        priority: parsed.priority,
        date: parsed.date ?? today,
        time: parsed.time ?? '',
        recurring: 'none',
        completed: false,
        listId: null,
        category: '',
      });
    } else if (parsed.type === 'note') {
      addNote(parsed.name, '', '', false);
    } else if (parsed.type === 'priority') {
      addPriority(today, parsed.name, parsed.date, parsed.time);
    } else if (parsed.type === 'event') {
      // Use the task slot for events — navigate to calendar for full entry
      addTask({
        name: parsed.name,
        desc: '',
        priority: 'medium',
        date: parsed.date ?? today,
        time: parsed.time ?? '',
        recurring: 'none',
        completed: false,
        listId: null,
        category: '',
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
    Animated.spring(successAnim, { toValue: 1, useNativeDriver: true }).start();
    setTimeout(() => router.back(), 1800);
  };

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.successScreen, { opacity: successAnim, transform: [{ scale: successAnim }] }]}>
          <CheckCircle2 size={64} color={Colors.success} />
          <Text style={styles.successTitle}>Created!</Text>
          <Text style={styles.successSub}>{parsed ? describeCommand(parsed) : ''}</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Voice Command</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Instruction */}
          <View style={styles.instructionBox}>
            <Mic size={20} color={Colors.primary} />
            <Text style={styles.instructionText}>
              Type a command below — or tap the{' '}
              <Text style={{ color: Colors.primary }}>microphone key</Text> on your keyboard to speak it.
            </Text>
          </View>

          {/* Command input */}
          <TextInput
            ref={inputRef}
            style={styles.commandInput}
            placeholder='e.g. "add task buy milk tomorrow"'
            placeholderTextColor={Colors.textDim}
            value={command}
            onChangeText={setCommand}
            autoFocus
            multiline
            returnKeyType="done"
          />

          {/* Parsed preview */}
          {parsed && parsed.name.trim().length > 0 && (
            <View style={[styles.previewCard, { borderColor: TYPE_COLORS[parsed.type] + '66' }]}>
              <View style={styles.previewHeader}>
                <Text style={[styles.previewTypeBadge, { backgroundColor: TYPE_COLORS[parsed.type] + '22', color: TYPE_COLORS[parsed.type] }]}>
                  {TYPE_LABELS[parsed.type]}
                </Text>
                {parsed.priority !== 'medium' && parsed.type === 'task' && (
                  <Text style={[styles.previewPriorityBadge, { color: parsed.priority === 'high' ? Colors.danger : Colors.success }]}>
                    {parsed.priority === 'high' ? '🔴 High' : '🟢 Low'}
                  </Text>
                )}
              </View>
              <Text style={styles.previewName}>{parsed.name}</Text>
              {(parsed.date || parsed.time) && (
                <Text style={styles.previewMeta}>
                  {parsed.date && (() => {
                    const d = new Date(parsed.date + 'T12:00:00');
                    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  })()}
                  {parsed.time && `  at ${parsed.time}`}
                </Text>
              )}
            </View>
          )}

          {/* Example commands */}
          {!command && (
            <View style={styles.examplesSection}>
              <Text style={styles.examplesLabel}>Try saying...</Text>
              {EXAMPLE_COMMANDS.map(ex => (
                <TouchableOpacity
                  key={ex}
                  style={styles.exampleChip}
                  onPress={() => setCommand(ex)}
                >
                  <Zap size={12} color={Colors.primary} />
                  <Text style={styles.exampleText}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Google Assistant Setup Guide */}
          <TouchableOpacity
            style={styles.guideToggle}
            onPress={() => setShowGuide(v => !v)}
          >
            <Text style={styles.guideToggleText}>How to connect Google Assistant</Text>
            {showGuide ? <ChevronUp size={16} color={Colors.primary} /> : <ChevronDown size={16} color={Colors.primary} />}
          </TouchableOpacity>

          {showGuide && (
            <View style={styles.guideBox}>
              <Text style={styles.guideTitle}>Google Assistant Routines</Text>
              <Text style={styles.guideStep}>
                <Text style={styles.guideBold}>1.</Text> Open Google app → More → Assistant → Routines
              </Text>
              <Text style={styles.guideStep}>
                <Text style={styles.guideBold}>2.</Text> Tap + New Routine
              </Text>
              <Text style={styles.guideStep}>
                <Text style={styles.guideBold}>3.</Text> Set a trigger phrase, e.g. "Add a task to Zenith"
              </Text>
              <Text style={styles.guideStep}>
                <Text style={styles.guideBold}>4.</Text> Add action → Apps → Open app → Zenith
              </Text>
              <Text style={styles.guideStep}>
                <Text style={styles.guideBold}>5.</Text> This opens Zenith so you can quickly type your command here
              </Text>

              <View style={styles.guideDivider} />

              <Text style={styles.guideTitle}>IFTTT (Dynamic voice → Zenith)</Text>
              <Text style={styles.guideStep}>
                <Text style={styles.guideBold}>1.</Text> Go to ifttt.com → Create → If: Google Assistant → "Say a phrase with a text ingredient"
              </Text>
              <Text style={styles.guideStep}>
                <Text style={styles.guideBold}>2.</Text> Phrase: "add task $" ($ is the ingredient)
              </Text>
              <Text style={styles.guideStep}>
                <Text style={styles.guideBold}>3.</Text> Then: Webhooks → Make a web request, or use the IFTTT Android app to open URL:
              </Text>
              <View style={styles.guideCodeBox}>
                <Text style={styles.guideCode}>rork-app:///voice-add?cmd=add+task+{'{{TextField}}'}</Text>
              </View>
              <Text style={styles.guideStep}>
                IFTTT replaces {'{{TextField}}'} with what you said, and Zenith creates the task automatically.
              </Text>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Create button */}
        {parsed && parsed.name.trim().length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
              <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.createBtnGradient}>
                <CheckCircle2 size={20} color="white" />
                <Text style={styles.createBtnText}>Create {TYPE_LABELS[parsed.type]}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  commandInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    color: Colors.text,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTypeBadge: {
    fontSize: 12,
    fontWeight: '700' as const,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  previewPriorityBadge: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  previewName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  previewMeta: {
    fontSize: 13,
    color: Colors.textDim,
  },
  examplesSection: {
    marginBottom: 20,
  },
  examplesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 13,
    color: Colors.textDim,
    flex: 1,
  },
  guideToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  guideToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  guideBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 6,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  guideStep: {
    fontSize: 13,
    color: Colors.textDim,
    lineHeight: 20,
  },
  guideBold: {
    color: Colors.text,
    fontWeight: '600' as const,
  },
  guideDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  guideCodeBox: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  guideCode: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  createBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'white',
  },
  successScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  successSub: {
    fontSize: 15,
    color: Colors.textDim,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
