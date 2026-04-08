import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Plus, Trash2, Check, Bell, Edit2, ImageIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import { updateHabitsWidget } from '@/widgets/widgetTaskHandler';
import { scheduleHabitsMorningReminder, cancelHabitsMorningReminder, scheduleHabitsEveningCheckIn, cancelHabitsEveningCheckIn, scheduleHabitsWeeklyDigest } from '@/utils/habitsNotifications';

const HABIT_EMOJIS = [
  '🏃', '🧘', '💪', '📚', '🥗', '💧', '🛌', '🧹',
  '🌿', '🎨', '🎯', '📝', '🚴', '🏊', '🍎', '☕',
  '🧠', '❤️', '🙏', '🌅', '💊', '🏋️', '🎸', '🌙',
  '⭐', '🔥', '💎', '🌟', '🐕', '🌸', '🎵', '✈️',
];

export default function HabitsScreen() {
  const { habits, habitCompletions, addHabit, updateHabit, deleteHabit, toggleHabitCompletion } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState('');
  const [habitImage, setHabitImage] = useState('');
  const [widgetModalVisible, setWidgetModalVisible] = useState(false);
  const [morningReminderEnabled, setMorningReminderEnabled] = useState(false);
  const [eveningCheckInEnabled, setEveningCheckInEnabled] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Widget data + smart notifications
  useEffect(() => {
    const doneTodayCount = habits.filter(h => habitCompletions[`${h.id}-${today}`]).length;

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

    const habitItems = habits.slice(0, 7).map(h => ({
      id: h.id,
      name: h.name,
      doneToday: !!habitCompletions[`${h.id}-${today}`],
      streakDays: (() => {
        let streak = 0;
        const base = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(base); d.setDate(d.getDate() - i);
          if (habitCompletions[`${h.id}-${d.toISOString().split('T')[0]}`]) { streak++; } else if (i > 0) { break; }
        }
        return streak;
      })(),
    }));

    const now = new Date();
    const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weekDays = [];
    let weeklySum = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayDone = habits.filter(h => !!habitCompletions[`${h.id}-${ds}`]).length;
      const pct = habits.length > 0 ? Math.round((dayDone / habits.length) * 100) : 0;
      weeklySum += pct;
      weekDays.push({ label: DAY_LABELS[d.getDay()], pct, isToday: i === 0 });
    }
    const weeklyPct = Math.round(weeklySum / 7);

    const daysElapsed = now.getDate();
    let monthlyCompletions = 0;
    for (let day = 1; day <= daysElapsed; day++) {
      const d = new Date(now.getFullYear(), now.getMonth(), day);
      const ds = d.toISOString().split('T')[0];
      monthlyCompletions += habits.filter(h => !!habitCompletions[`${h.id}-${ds}`]).length;
    }
    const monthlyPct = habits.length > 0 && daysElapsed > 0
      ? Math.round((monthlyCompletions / (habits.length * daysElapsed)) * 100)
      : 0;

    updateHabitsWidget({ habits: habitItems as any, doneTodayCount, totalHabits: habits.length, bestStreakName, bestStreakDays, weeklyPct, monthlyPct, weekDays: weekDays as any });
    scheduleHabitsMorningReminder(habits.length);
    scheduleHabitsEveningCheckIn(doneTodayCount, habits.length);
    scheduleHabitsWeeklyDigest(bestStreakDays, bestStreakName);
  }, [habits, habitCompletions, today]);

  const resetForm = () => {
    setHabitName('');
    setHabitIcon('');
    setHabitImage('');
    setEditingHabitId(null);
  };

  const handleSaveHabit = () => {
    if (!habitName.trim()) return;
    if (editingHabitId !== null) {
      updateHabit(editingHabitId, {
        name: habitName.trim(),
        icon: habitIcon || undefined,
        image: habitImage || undefined,
      });
    } else {
      addHabit(habitName.trim(), habitIcon || undefined, habitImage || undefined);
    }
    resetForm();
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleEditHabit = (habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    setEditingHabitId(habitId);
    setHabitName(habit.name);
    setHabitIcon(habit.icon || '');
    setHabitImage(habit.image || '');
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to set a habit image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const sourceUri = result.assets[0].uri;
        const filename = `habit_${Date.now()}.jpg`;
        const destUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.copyAsync({ from: sourceUri, to: destUri });
        setHabitImage(destUri);
        setHabitIcon('');
      } catch {
        Alert.alert('Error', 'Could not save image. Please try again.');
      }
    }
  };

  const getHabitStats = (habitId: number) => {
    const todayDate = new Date();
    let completed = 0;
    const total = 30;
    for (let i = 0; i < 30; i++) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      const key = `${habitId}-${date.toISOString().split('T')[0]}`;
      if (habitCompletions[key]) completed++;
    }
    return { percentage: Math.round((completed / total) * 100), completed, total };
  };

  const getStreak = (habitId: number) => {
    let streak = 0;
    const todayDate = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      const key = `${habitId}-${date.toISOString().split('T')[0]}`;
      if (habitCompletions[key]) { streak++; } else if (i > 0) { break; }
    }
    return streak;
  };

  const previewHasContent = habitIcon || habitImage;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>⭐ Habits</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={{ padding: 8 }} onPress={() => setWidgetModalVisible(true)}>
            <Bell size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => { resetForm(); setModalVisible(true); }}
          >
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.addButtonGradient}>
              <Plus size={20} color="white" />
              <Text style={styles.addButtonText}>Add Habit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.habitList} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <Text style={styles.emptyText}>No habits created yet</Text>
        ) : (
          habits.map(habit => {
            const stats = getHabitStats(habit.id);
            const streak = getStreak(habit.id);
            const todayCompleted = habitCompletions[`${habit.id}-${today}`];
            const hasCustomIcon = !!(habit.icon || habit.image);

            return (
              <View key={habit.id} style={styles.habitCard}>
                <View style={styles.habitHeader}>
                  {/* Left: custom icon/image or progress ring */}
                  {hasCustomIcon ? (
                    <View style={styles.habitIconSlot}>
                      {habit.image ? (
                        <Image source={{ uri: habit.image }} style={styles.habitIconImage} />
                      ) : (
                        <LinearGradient
                          colors={[Colors.primary + '33', Colors.secondary + '33']}
                          style={styles.habitIconEmojiBg}
                        >
                          <Text style={styles.habitIconEmoji}>{habit.icon}</Text>
                        </LinearGradient>
                      )}
                      <View style={styles.habitIconBadge}>
                        <Text style={styles.habitIconBadgeText}>{stats.percentage}%</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.progressPie}>
                      <View style={[styles.progressPieInner, { backgroundColor: Colors.card }]}>
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
                  )}

                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <Text style={styles.habitStats}>{stats.completed}/{stats.total} days completed</Text>
                    {streak > 0 && <Text style={styles.streakText}>🔥 {streak} day streak!</Text>}
                  </View>

                  {/* Edit button */}
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditHabit(habit.id)}
                  >
                    <Edit2 size={15} color={Colors.textDim} />
                  </TouchableOpacity>
                </View>

                <View style={styles.habitActions}>
                  <TouchableOpacity
                    style={[styles.completeButton, todayCompleted && styles.completeButtonDone]}
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
                        <View style={[styles.weekDayDot, isCompleted && styles.weekDayDotCompleted, isToday && styles.weekDayDotToday]}>
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

      {/* Add / Edit Habit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { resetForm(); setModalVisible(false); }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingHabitId ? '✏️ Edit Habit' : 'Add Habit'}</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Habit name *"
                placeholderTextColor={Colors.textDim}
                value={habitName}
                onChangeText={setHabitName}
                autoFocus={!editingHabitId}
              />

              {/* Icon preview */}
              {previewHasContent && (
                <View style={styles.iconPreviewRow}>
                  <View style={styles.iconPreview}>
                    {habitImage ? (
                      <Image source={{ uri: habitImage }} style={styles.iconPreviewImage} />
                    ) : (
                      <Text style={styles.iconPreviewEmoji}>{habitIcon}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.clearIconButton}
                    onPress={() => { setHabitIcon(''); setHabitImage(''); }}
                  >
                    <Text style={styles.clearIconText}>Clear icon</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Emoji grid */}
              <Text style={styles.sectionLabel}>Choose an icon</Text>
              <View style={styles.emojiGrid}>
                {HABIT_EMOJIS.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.emojiCell, habitIcon === emoji && !habitImage && styles.emojiCellSelected]}
                    onPress={() => { setHabitIcon(emoji); setHabitImage(''); }}
                  >
                    <Text style={styles.emojiCellText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Upload photo */}
              <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                <ImageIcon size={18} color={Colors.primary} />
                <Text style={styles.uploadButtonText}>
                  {habitImage ? 'Change photo' : 'Upload your own photo'}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => { resetForm(); setModalVisible(false); }}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleSaveHabit}>
                  <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.modalButtonGradient}>
                    <Text style={styles.modalButtonText}>Save Habit</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Widget & Notification Settings Modal */}
      <Modal
        visible={widgetModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWidgetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>📱 Widgets & Notifications</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: Colors.textDim, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                Add a "Habits Today" widget: Long-press your Android home screen → Widgets → Zenith → Habits Today. Shows completion count, best streak, and today's progress.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>Morning Reminder</Text>
                  <Text style={{ color: Colors.textDim, fontSize: 12, marginTop: 2 }}>8 AM prompt to complete your habits today</Text>
                </View>
                <Switch
                  value={morningReminderEnabled}
                  onValueChange={async (v) => {
                    setMorningReminderEnabled(v);
                    if (v) { await scheduleHabitsMorningReminder(habits.length); }
                    else { await cancelHabitsMorningReminder(); }
                  }}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primary }}
                  thumbColor={morningReminderEnabled ? '#ffffff' : Colors.textDim}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>Evening Check-In</Text>
                  <Text style={{ color: Colors.textDim, fontSize: 12, marginTop: 2 }}>9 PM reminder to log any remaining habits</Text>
                </View>
                <Switch
                  value={eveningCheckInEnabled}
                  onValueChange={async (v) => {
                    setEveningCheckInEnabled(v);
                    const doneTodayCount = habits.filter(h => habitCompletions[`${h.id}-${today}`]).length;
                    if (v) { await scheduleHabitsEveningCheckIn(doneTodayCount, habits.length); }
                    else { await cancelHabitsEveningCheckIn(); }
                  }}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primary }}
                  thumbColor={eveningCheckInEnabled ? '#ffffff' : Colors.textDim}
                />
              </View>
            </ScrollView>
            <TouchableOpacity
              style={{ backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
              onPress={() => setWidgetModalVisible(false)}
            >
              <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
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
    gap: 12,
  },
  // Custom icon/image slot
  habitIconSlot: {
    width: 60,
    height: 60,
    position: 'relative',
  },
  habitIconImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  habitIconEmojiBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIconEmoji: {
    fontSize: 28,
  },
  habitIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 28,
    alignItems: 'center',
  },
  habitIconBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: 'white',
  },
  // Default progress circle
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
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Modal
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
    maxHeight: '90%',
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
  // Icon preview
  iconPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconPreview: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  iconPreviewImage: {
    width: 56,
    height: 56,
  },
  iconPreviewEmoji: {
    fontSize: 28,
  },
  clearIconButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearIconText: {
    fontSize: 12,
    color: Colors.textDim,
  },
  // Emoji grid
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textDim,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '22',
  },
  emojiCellText: {
    fontSize: 22,
  },
  // Upload button
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  uploadButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
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
