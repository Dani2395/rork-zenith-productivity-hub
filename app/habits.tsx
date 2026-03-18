import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Plus, Trash2, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import { saveHabitsWidgetData } from '@/widgets/widgetTaskHandler';
import { scheduleHabitsMorningReminder, scheduleHabitsEveningCheckIn, scheduleHabitsWeeklyDigest } from '@/utils/habitsNotifications';

export default function HabitsScreen() {
  const { habits, habitCompletions, addHabit, deleteHabit, toggleHabitCompletion } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [habitName, setHabitName] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Widget data + smart notifications
  useEffect(() => {
    const doneTodayCount = habits.filter(h => habitCompletions[`${h.id}-${today}`]).length;

    // Find best streak
    let bestStreakName = '';
    let bestStreakDays = 0;
    for (const habit of habits) {
      let streak = 0;
      const base = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(base);
        d.setDate(d.getDate() - i);
        const key = `${habit.id}-${d.toISOString().split('T')[0]}`;
        if (habitCompletions[key]) { streak++; } else if (i > 0) { break; }
      }
      if (streak > bestStreakDays) { bestStreakDays = streak; bestStreakName = habit.name; }
    }

    saveHabitsWidgetData({ doneTodayCount, totalHabits: habits.length, bestStreakName, bestStreakDays });
    scheduleHabitsMorningReminder(habits.length);
    scheduleHabitsEveningCheckIn(doneTodayCount, habits.length);
    scheduleHabitsWeeklyDigest(bestStreakDays, bestStreakName);
  }, [habits, habitCompletions, today]);

  const handleSaveHabit = () => {
    if (habitName.trim()) {
      addHabit(habitName.trim());
      setHabitName('');
      setModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getHabitStats = (habitId: number) => {
    const todayDate = new Date();
    let completed = 0;
    let total = 30;

    for (let i = 0; i < 30; i++) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const key = `${habitId}-${dateStr}`;
      if (habitCompletions[key]) completed++;
    }

    return {
      percentage: Math.round((completed / total) * 100),
      completed,
      total,
    };
  };

  const getStreak = (habitId: number) => {
    let streak = 0;
    const todayDate = new Date();

    for (let i = 0; i < 365; i++) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const key = `${habitId}-${dateStr}`;
      if (habitCompletions[key]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>⭐ Habits</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.addButtonGradient}
          >
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Add Habit</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.habitList} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <Text style={styles.emptyText}>No habits created yet</Text>
        ) : (
          habits.map(habit => {
            const stats = getHabitStats(habit.id);
            const streak = getStreak(habit.id);
            const todayCompleted = habitCompletions[`${habit.id}-${today}`];

            return (
              <View key={habit.id} style={styles.habitCard}>
                <View style={styles.habitHeader}>
                  <View style={styles.progressPie}>
                    <View
                      style={[
                        styles.progressPieInner,
                        {
                          backgroundColor: Colors.card,
                        },
                      ]}
                    >
                      <Text style={styles.progressText}>{stats.percentage}%</Text>
                    </View>
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        styles.progressCircle,
                        {
                          borderColor: Colors.success,
                          borderTopColor: stats.percentage >= 25 ? Colors.success : 'transparent',
                          borderRightColor: stats.percentage >= 50 ? Colors.success : 'transparent',
                          borderBottomColor: stats.percentage >= 75 ? Colors.success : 'transparent',
                          borderLeftColor: stats.percentage >= 100 ? Colors.success : 'transparent',
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <Text style={styles.habitStats}>
                      {stats.completed}/{stats.total} days completed
                    </Text>
                    {streak > 0 && (
                      <Text style={styles.streakText}>🔥 {streak} day streak!</Text>
                    )}
                  </View>
                </View>

                <View style={styles.habitActions}>
                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      todayCompleted && styles.completeButtonDone,
                    ]}
                    onPress={() => {
                      toggleHabitCompletion(habit.id, today);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                  >
                    {todayCompleted ? (
                      <Check size={20} color="white" />
                    ) : (
                      <Text style={styles.completeButtonText}>Complete Today</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      deleteHabit(habit.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                  >
                    <Trash2 size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekView}>
                  {[...Array(7)].map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    const dateStr = date.toISOString().split('T')[0];
                    const isCompleted = habitCompletions[`${habit.id}-${dateStr}`];
                    const isToday = dateStr === today;

                    return (
                      <View key={i} style={styles.weekDay}>
                        <Text style={styles.weekDayLabel}>
                          {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </Text>
                        <View
                          style={[
                            styles.weekDayDot,
                            isCompleted && styles.weekDayDotCompleted,
                            isToday && styles.weekDayDotToday,
                          ]}
                        >
                          {isCompleted && <Check size={12} color="white" />}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Habit</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Habit name *"
              placeholderTextColor={Colors.textDim}
              value={habitName}
              onChangeText={setHabitName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setHabitName('');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveHabit}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Save Habit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
  habitList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textDim,
    marginTop: 40,
    fontSize: 14,
  },
  habitCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressPie: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPieInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  progressCircle: {
    borderRadius: 30,
    borderWidth: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  habitStats: {
    fontSize: 12,
    color: Colors.textDim,
  },
  streakText: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 4,
  },
  habitActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  completeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  completeButtonDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  completeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  weekDay: {
    alignItems: 'center',
  },
  weekDayLabel: {
    fontSize: 11,
    color: Colors.textDim,
    marginBottom: 6,
  },
  weekDayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayDotCompleted: {
    backgroundColor: Colors.success,
  },
  weekDayDotToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
});
