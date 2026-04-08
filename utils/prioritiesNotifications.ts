/**
 * Top 5 Priorities smart notifications.
 *
 * 1. Morning priority brief  – 7 AM daily: lists today's priorities
 * 2. Evening completion check – 8 PM daily: shows completion status
 * 3. Weekly productivity digest – Sunday 7 PM
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

async function ensurePrioritiesChannel() {
  const N = getNotifications();
  if (!N) return;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('priorities', {
      name: 'Priority Reminders',
      description: 'Daily priority briefs and completion check-ins',
      importance: N.AndroidImportance.HIGH,
      lightColor: '#f59e0b',
    });
  }
}

const STORAGE_KEY = 'prioritiesNotificationIds';

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

// ─── 1. Morning priority brief ────────────────────────────────────────────────

export async function schedulePrioritiesMorningBrief(
  totalCount: number,
  firstPriority: string,
) {
  const N = getNotifications();
  if (!N || totalCount === 0) return;
  await ensurePrioritiesChannel();
  await cancelById('morning');

  const body = firstPriority
    ? `Focus on: "${firstPriority}" + ${totalCount - 1} more`
    : `${totalCount} priorit${totalCount !== 1 ? 'ies' : 'y'} set for today`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '⭐ Today\'s Priorities',
        body,
        data: { type: 'priorities_morning' },
        channelId: 'priorities',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
        hour: 7,
        minute: 0,
      },
    });
    const ids = await loadIds();
    ids.morning = id;
    await saveIds(ids);
  } catch (e) {
    console.log('schedulePrioritiesMorningBrief error', e);
  }
}

export async function cancelPrioritiesMorningBrief() {
  await cancelById('morning');
}

// ─── 2. Evening completion check ──────────────────────────────────────────────

export async function schedulePrioritiesEveningCheck(
  completedCount: number,
  totalCount: number,
) {
  const N = getNotifications();
  if (!N || totalCount === 0) return;
  await ensurePrioritiesChannel();
  await cancelById('evening');

  const allDone = completedCount >= totalCount;
  const title = allDone ? '🎉 All priorities done!' : '⭐ Priorities check-in';
  const body = allDone
    ? `You crushed all ${totalCount} priorities today!`
    : `${completedCount} of ${totalCount} priorities done — finish the day strong!`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'priorities_evening' },
        channelId: 'priorities',
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
    console.log('schedulePrioritiesEveningCheck error', e);
  }
}

export async function cancelPrioritiesEveningCheck() {
  await cancelById('evening');
}

// ─── 3. Weekly productivity digest ───────────────────────────────────────────

export async function schedulePrioritiesWeeklyDigest(
  completedThisWeek: number,
  totalThisWeek: number,
) {
  const N = getNotifications();
  if (!N) return;
  await ensurePrioritiesChannel();
  await cancelById('weekly');

  const body = totalThisWeek === 0
    ? 'Set your priorities for next week!'
    : `This week: ${completedThisWeek} of ${totalThisWeek} priorities completed`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '📊 Weekly Productivity Recap',
        body,
        data: { type: 'priorities_weekly' },
        channelId: 'priorities',
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
    console.log('schedulePrioritiesWeeklyDigest error', e);
  }
}

export async function cancelAllPrioritiesNotifications() {
  await cancelById('morning');
  await cancelById('evening');
  await cancelById('weekly');
}
