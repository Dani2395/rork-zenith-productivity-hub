/**
 * Habits smart notifications.
 *
 * 1. Morning reminder   – 8 AM daily: "Time to track your habits"
 * 2. Evening check-in  – 8 PM daily: shows completion status
 * 3. Weekly streak digest – Sunday 7 PM
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let Notifications: any = null;
function getNotifications() {
  if (!Notifications) {
    try { Notifications = require('expo-notifications'); } catch { /* Expo Go */ }
  }
  return Notifications;
}

async function ensureHabitsChannel() {
  const N = getNotifications();
  if (!N) return;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('habits', {
      name: 'Habit Reminders',
      description: 'Daily habit reminders and streak updates',
      importance: N.AndroidImportance.DEFAULT,
      lightColor: '#10b981',
    });
  }
}

const STORAGE_KEY = 'habitsNotificationIds';

async function loadIds(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveIds(ids: Record<string, string>) {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

async function cancelById(key: string) {
  const N = getNotifications();
  if (!N) return;
  const ids = await loadIds();
  if (ids[key]) {
    try { await N.cancelScheduledNotificationAsync(ids[key]); } catch { /* ignore */ }
    delete ids[key];
    await saveIds(ids);
  }
}

// ─── 1. Morning reminder ──────────────────────────────────────────────────────

export async function scheduleHabitsMorningReminder(habitCount: number) {
  const N = getNotifications();
  if (!N || habitCount === 0) return;
  await ensureHabitsChannel();
  await cancelById('morning');

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '🔥 Habit Time!',
        body: `Don't forget your ${habitCount} habit${habitCount !== 1 ? 's' : ''} today`,
        data: { type: 'habits_morning' },
        channelId: 'habits',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
        hour: 8,
        minute: 0,
      },
    });
    const ids = await loadIds();
    ids.morning = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleHabitsMorningReminder error', e);
  }
}

export async function cancelHabitsMorningReminder() {
  await cancelById('morning');
}

// ─── 2. Evening check-in ──────────────────────────────────────────────────────

export async function scheduleHabitsEveningCheckIn(
  doneCount: number,
  totalCount: number,
) {
  const N = getNotifications();
  if (!N || totalCount === 0) return;
  await ensureHabitsChannel();
  await cancelById('evening');

  const allDone = doneCount >= totalCount;
  const title = allDone ? '🎉 All habits done!' : '🔔 Habits check-in';
  const body = allDone
    ? `You completed all ${totalCount} habits today — great work!`
    : `${doneCount} of ${totalCount} habits done — finish strong!`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'habits_evening' },
        channelId: 'habits',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
        hour: 20,
        minute: 0,
      },
    });
    const ids = await loadIds();
    ids.evening = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleHabitsEveningCheckIn error', e);
  }
}

export async function cancelHabitsEveningCheckIn() {
  await cancelById('evening');
}

// ─── 3. Weekly streak digest ──────────────────────────────────────────────────

export async function scheduleHabitsWeeklyDigest(
  bestStreak: number,
  bestHabitName: string,
) {
  const N = getNotifications();
  if (!N) return;
  await ensureHabitsChannel();
  await cancelById('weekly');

  const body = bestHabitName && bestStreak > 0
    ? `Best streak: "${bestHabitName}" — ${bestStreak} day${bestStreak !== 1 ? 's' : ''} in a row!`
    : 'Keep building your habits — consistency is key!';

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '🔥 Weekly Habit Report',
        body,
        data: { type: 'habits_weekly' },
        channelId: 'habits',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes?.WEEKLY ?? 'weekly',
        weekday: 1,
        hour: 19,
        minute: 0,
      },
    });
    const ids = await loadIds();
    ids.weekly = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleHabitsWeeklyDigest error', e);
  }
}

export async function cancelAllHabitsNotifications() {
  await cancelById('morning');
  await cancelById('evening');
  await cancelById('weekly');
}
