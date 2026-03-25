import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

import {
  scheduleTasksDailySummary,
  cancelTasksDailySummary,
  clearOverdueAlerts,
  scheduleTasksWeeklyDigest,
  cancelTasksWeeklyDigest,
} from '@/utils/tasksNotifications';
import {
  schedulePrioritiesMorningBrief,
  cancelPrioritiesMorningBrief,
  schedulePrioritiesEveningCheck,
  cancelPrioritiesEveningCheck,
} from '@/utils/prioritiesNotifications';
import {
  scheduleCalendarDailyAgenda,
  cancelCalendarDailyAgenda,
} from '@/utils/calendarNotifications';
import { cancelAllHabitsNotifications, scheduleHabitsMorningReminder, scheduleHabitsEveningCheckIn } from '@/utils/habitsNotifications';
import { cancelAllNotesNotifications, schedulePinnedNotesReminder } from '@/utils/notesNotifications';
import { cancelAllGiftsNotifications, scheduleGiftsMonthlyReminder } from '@/utils/giftsNotifications';
import { cancelAllBudgetNotifications, scheduleDailySummary as scheduleBudgetDailySummary } from '@/utils/budgetNotifications';
import { cancelAllBingoNotifications, scheduleBingoWeeklyCheckIn } from '@/utils/bingoNotifications';

const PREFS_KEY = 'notificationPreferences';

interface Prefs {
  tasksDailySummary: boolean;
  tasksOverdueAlerts: boolean;
  tasksWeeklyDigest: boolean;
  prioritiesMorningBrief: boolean;
  prioritiesEveningCheck: boolean;
  calendarDailyAgenda: boolean;
  calendarEventReminders: boolean;
  habitsMorning: boolean;
  habitsEvening: boolean;
  notesPinnedReminder: boolean;
  giftsMonthlyReminder: boolean;
  budgetDailySummary: boolean;
  bingoWeeklyCheckIn: boolean;
}

const DEFAULTS: Prefs = {
  tasksDailySummary: true,
  tasksOverdueAlerts: true,
  tasksWeeklyDigest: false,
  prioritiesMorningBrief: true,
  prioritiesEveningCheck: true,
  calendarDailyAgenda: true,
  calendarEventReminders: true,
  habitsMorning: false,
  habitsEvening: false,
  notesPinnedReminder: false,
  giftsMonthlyReminder: false,
  budgetDailySummary: false,
  bingoWeeklyCheckIn: false,
};

export async function loadNotificationPrefs(): Promise<Prefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

async function savePrefs(prefs: Prefs) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

async function applyPref(key: keyof Prefs, enabled: boolean) {
  switch (key) {
    case 'tasksDailySummary': {
      if (enabled) {
        const tasks: any[] = JSON.parse((await AsyncStorage.getItem('tasks')) ?? '[]');
        const today = new Date().toISOString().split('T')[0];
        const todayCount = tasks.filter(t => t.dueDate === today && !t.completed).length;
        const overdueCount = tasks.filter(t => t.dueDate && t.dueDate < today && !t.completed).length;
        await scheduleTasksDailySummary(todayCount, overdueCount);
      } else {
        await cancelTasksDailySummary();
      }
      break;
    }
    case 'tasksOverdueAlerts': {
      if (!enabled) await clearOverdueAlerts();
      break;
    }
    case 'tasksWeeklyDigest': {
      if (enabled) {
        const tasks: any[] = JSON.parse((await AsyncStorage.getItem('tasks')) ?? '[]');
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const completed = tasks.filter(t => t.completed && t.completedDate >= weekAgo).length;
        await scheduleTasksWeeklyDigest(completed, tasks.length);
      } else {
        await cancelTasksWeeklyDigest();
      }
      break;
    }
    case 'prioritiesMorningBrief': {
      if (enabled) {
        const priorities: any = JSON.parse((await AsyncStorage.getItem('priorities')) ?? '{}');
        const today = new Date().toISOString().split('T')[0];
        const todayList: any[] = priorities[today] ?? [];
        const first = todayList.find(p => !p.completed)?.task ?? 'your top priority';
        await schedulePrioritiesMorningBrief(todayList.length, first);
      } else {
        await cancelPrioritiesMorningBrief();
      }
      break;
    }
    case 'prioritiesEveningCheck': {
      if (enabled) {
        const priorities: any = JSON.parse((await AsyncStorage.getItem('priorities')) ?? '{}');
        const today = new Date().toISOString().split('T')[0];
        const todayList: any[] = priorities[today] ?? [];
        const completed = todayList.filter(p => p.completed).length;
        await schedulePrioritiesEveningCheck(completed, todayList.length);
      } else {
        await cancelPrioritiesEveningCheck();
      }
      break;
    }
    case 'calendarDailyAgenda': {
      if (enabled) {
        const events: any[] = JSON.parse((await AsyncStorage.getItem('events')) ?? '[]');
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = events.filter(e => e.date === today);
        await scheduleCalendarDailyAgenda(todayEvents.length, todayEvents[0]?.name ?? '');
      } else {
        await cancelCalendarDailyAgenda();
      }
      break;
    }
    case 'calendarEventReminders':
      // Per-event reminders are scheduled when events are created/edited.
      // Disabling cancels all existing ones.
      if (!enabled) await cancelCalendarDailyAgenda();
      break;
    case 'habitsMorning': {
      if (enabled) {
        const habits: any[] = JSON.parse((await AsyncStorage.getItem('habits')) ?? '[]');
        await scheduleHabitsMorningReminder(habits.length);
      } else {
        await cancelAllHabitsNotifications();
      }
      break;
    }
    case 'habitsEvening': {
      if (enabled) {
        await scheduleHabitsEveningCheckIn(0, 0);
      } else {
        await cancelAllHabitsNotifications();
      }
      break;
    }
    case 'notesPinnedReminder': {
      if (enabled) {
        const notes: any[] = JSON.parse((await AsyncStorage.getItem('notes')) ?? '[]');
        const pinned = notes.filter(n => n.pinned).length;
        await schedulePinnedNotesReminder(pinned);
      } else {
        await cancelAllNotesNotifications();
      }
      break;
    }
    case 'giftsMonthlyReminder': {
      if (enabled) {
        const people: any[] = JSON.parse((await AsyncStorage.getItem('giftPeople')) ?? '[]');
        const unpurchased = people.flatMap(p => p.gifts ?? []).filter((g: any) => !g.purchased).length;
        await scheduleGiftsMonthlyReminder(unpurchased);
      } else {
        await cancelAllGiftsNotifications();
      }
      break;
    }
    case 'budgetDailySummary': {
      if (enabled) {
        const txs: any[] = JSON.parse((await AsyncStorage.getItem('transactions')) ?? '[]');
        const now = new Date();
        const mo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const label = now.toLocaleString('default', { month: 'short', year: 'numeric' });
        const moTxs = txs.filter(t => (t.date ?? '').startsWith(mo));
        const income = moTxs.filter(t => t.type === 'income').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
        const expenses = moTxs.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
        await scheduleBudgetDailySummary(label, income, expenses);
      } else {
        await cancelAllBudgetNotifications();
      }
      break;
    }
    case 'bingoWeeklyCheckIn': {
      if (enabled) {
        const bingo: any[] = JSON.parse((await AsyncStorage.getItem('bingoData')) ?? '[]');
        const done = bingo.filter(c => c.d).length;
        await scheduleBingoWeeklyCheckIn(done);
      } else {
        await cancelAllBingoNotifications();
      }
      break;
    }
  }
}

type Section = {
  title: string;
  emoji: string;
  color: string;
  rows: { key: keyof Prefs; label: string; sub: string }[];
};

const SECTIONS: Section[] = [
  {
    title: 'Tasks',
    emoji: '✅',
    color: '#6366f1',
    rows: [
      { key: 'tasksDailySummary', label: 'Daily Morning Summary', sub: 'Tasks due today — 8 AM' },
      { key: 'tasksOverdueAlerts', label: 'Overdue Alerts', sub: 'Instant alert when a task is overdue' },
      { key: 'tasksWeeklyDigest', label: 'Weekly Digest', sub: 'Week recap — Sunday 7 PM' },
    ],
  },
  {
    title: 'Top Priorities',
    emoji: '⭐',
    color: '#f59e0b',
    rows: [
      { key: 'prioritiesMorningBrief', label: 'Morning Brief', sub: "Today's focus — 7 AM" },
      { key: 'prioritiesEveningCheck', label: 'Evening Check-In', sub: 'How many done — 8 PM' },
    ],
  },
  {
    title: 'Calendar Events',
    emoji: '📅',
    color: '#818cf8',
    rows: [
      { key: 'calendarEventReminders', label: 'Event Reminders', sub: '1 hour before each event' },
      { key: 'calendarDailyAgenda', label: 'Daily Agenda', sub: "Today's events — 8 AM" },
    ],
  },
  {
    title: 'Habits',
    emoji: '🔥',
    color: '#10b981',
    rows: [
      { key: 'habitsMorning', label: 'Morning Reminder', sub: 'Time to track — 8 AM' },
      { key: 'habitsEvening', label: 'Evening Check-In', sub: 'How many done — 8 PM' },
    ],
  },
  {
    title: 'Notes',
    emoji: '📝',
    color: '#fbbf24',
    rows: [
      { key: 'notesPinnedReminder', label: 'Pinned Notes Reminder', sub: 'Review pinned notes — 9 AM' },
    ],
  },
  {
    title: 'Gifts',
    emoji: '🎁',
    color: '#ec4899',
    rows: [
      { key: 'giftsMonthlyReminder', label: 'Monthly Reminder', sub: 'Unpurchased gifts — 1st of month' },
    ],
  },
  {
    title: 'Budget',
    emoji: '💰',
    color: '#34d399',
    rows: [
      { key: 'budgetDailySummary', label: 'Daily Summary', sub: 'Income & expenses — 8 AM' },
    ],
  },
  {
    title: 'Bingo Goals',
    emoji: '🎯',
    color: '#a855f7',
    rows: [
      { key: 'bingoWeeklyCheckIn', label: 'Weekly Check-In', sub: 'Goals progress — Sunday 7:30 PM' },
    ],
  },
];

export default function NotificationsScreen() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<keyof Prefs | null>(null);

  useEffect(() => {
    loadNotificationPrefs().then(p => {
      setPrefs(p);
      setLoading(false);
    });
  }, []);

  const toggle = async (key: keyof Prefs, value: boolean) => {
    setApplying(key);
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await savePrefs(next);
    await applyPref(key, value);
    setApplying(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageSubtitle}>Choose which notifications you receive</Text>

        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>{section.emoji}</Text>
              <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
            </View>

            {section.rows.map((row, i) => {
              const isLast = i === section.rows.length - 1;
              return (
                <View
                  key={row.key}
                  style={[styles.row, isLast && styles.rowLast]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <Text style={styles.rowSub}>{row.sub}</Text>
                  </View>
                  {applying === row.key ? (
                    <ActivityIndicator size="small" color={section.color} />
                  ) : (
                    <Switch
                      value={prefs[row.key]}
                      onValueChange={v => toggle(row.key, v)}
                      trackColor={{ false: '#1e1e2e', true: section.color + '66' }}
                      thumbColor={prefs[row.key] ? section.color : '#4b5563'}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <Text style={styles.footer}>
          Event-specific reminders (e.g. individual task or calendar event alerts) are managed from within each screen.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  pageSubtitle: {
    fontSize: 13,
    color: Colors.textDim,
    marginBottom: 20,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 2,
  },
  footer: {
    fontSize: 11,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
