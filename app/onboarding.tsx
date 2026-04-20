import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import Colors from '@/constants/colors';

const { width: W } = Dimensions.get('window');

const STEPS = [
  {
    emoji: '✨',
    title: 'Welcome to Zenith',
    subtitle: 'Your whole life, beautifully organized in one place.',
    detail: 'Track habits, manage tasks, log workouts, plan budgets, capture notes, and more — all connected in a single, unified timeline.',
    color: Colors.primary,
  },
  {
    emoji: '⭐',
    title: 'Build Powerful Habits',
    subtitle: 'Streaks, analytics, and daily momentum.',
    detail: 'See your 12-week completion heatmap, day-of-week patterns, and longest streaks. Know exactly which days you thrive — and which need work.',
    color: '#f59e0b',
  },
  {
    emoji: '🧠',
    title: 'Brain Dump Anything',
    subtitle: 'Capture ideas before they disappear.',
    detail: 'Type or speak a thought and Zenith\'s NLP parser routes it to the right place automatically — task, event, note, or priority.',
    color: '#8b5cf6',
  },
  {
    emoji: '💰',
    title: 'Master Your Money',
    subtitle: 'Budgets, debts, savings goals — all in one view.',
    detail: 'Assign every dollar to a category. Track what you\'ve spent vs. budgeted. Watch your debt shrink and your savings grow month by month.',
    color: Colors.success,
  },
  {
    emoji: '🎯',
    title: 'Your 2026 Bingo Board',
    subtitle: 'Turn your goals into a game worth winning.',
    detail: 'Set 24 meaningful goals on your personal bingo board. Complete rows and columns to unlock rewards you choose for yourself.',
    color: '#ec4899',
  },
  {
    emoji: '🚀',
    title: "You're All Set",
    subtitle: 'Everything is ready. Start where you like.',
    detail: 'Your data stays private on your device. Export a backup anytime from Settings. Tap any section from the home screen to get started.',
    color: Colors.primary,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useData();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const animateToStep = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      handleFinish();
    } else {
      animateToStep(step + 1);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { if (i < step) { Haptics.selectionAsync(); animateToStep(i); } }}
            style={[
              styles.dot,
              i === step && { backgroundColor: current.color, width: 24 },
              i < step && { backgroundColor: current.color + '66' },
            ]}
          />
        ))}
      </View>

      {/* Card */}
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient
          colors={[current.color + '22', current.color + '08']}
          style={styles.cardGradient}
        >
          <View style={[styles.emojiContainer, { borderColor: current.color + '44' }]}>
            <Text style={styles.emoji}>{current.emoji}</Text>
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={[styles.subtitle, { color: current.color }]}>{current.subtitle}</Text>
          <Text style={styles.detail}>{current.detail}</Text>
        </LinearGradient>
      </Animated.View>

      {/* Feature grid (shown on welcome step only) */}
      {step === 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featureScroll}
          style={styles.featureScrollWrapper}
        >
          {[
            { e: '⭐', l: 'Habits' },
            { e: '✅', l: 'Tasks' },
            { e: '📅', l: 'Calendar' },
            { e: '💪', l: 'Workout' },
            { e: '📝', l: 'Notes' },
            { e: '💰', l: 'Budget' },
            { e: '📚', l: 'Books' },
            { e: '🎁', l: 'Gifts' },
            { e: '🎯', l: 'Bingo' },
            { e: '🧠', l: 'Brain Dump' },
          ].map(f => (
            <View key={f.l} style={styles.featureChip}>
              <Text style={styles.featureChipEmoji}>{f.e}</Text>
              <Text style={styles.featureChipLabel}>{f.l}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => { Haptics.selectionAsync(); animateToStep(step - 1); }}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={[current.color, current.color + 'cc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {isLast ? "Let's go!" : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
          <Text style={styles.skipText}>Skip intro</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardGradient: {
    padding: 28,
    alignItems: 'center',
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  detail: {
    fontSize: 14,
    color: Colors.textDim,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureScrollWrapper: {
    marginTop: 20,
    flexGrow: 0,
  },
  featureScroll: {
    gap: 8,
    paddingHorizontal: 4,
  },
  featureChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  featureChipEmoji: {
    fontSize: 16,
  },
  featureChipLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDim,
  },
  nextButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    color: Colors.textDim,
  },
});
