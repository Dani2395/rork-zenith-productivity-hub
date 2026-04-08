/**
 * Bingo Goals smart notifications.
 *
 * 1. Goal completed milestone – immediate when a row/column/diagonal is complete
 * 2. Weekly bingo check-in    – Sunday 7 PM: progress update
 * 3. Monthly motivation       – 1st of each month: progress summary
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

async function ensureBingoChannel() {
  const N = getNotifications();
  if (!N) return;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('bingo', {
      name: 'Bingo Goal Alerts',
      description: 'Goal completion milestones and progress updates',
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 100, 300, 100, 300],
      lightColor: '#a855f7',
    });
  }
}

const STORAGE_KEY = 'bingoNotificationIds';

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

// ─── 1. Bingo milestone alert ─────────────────────────────────────────────────

/**
 * Fire when a bingo line (row/col/diagonal) is completed.
 * Only fires once per milestone key.
 */
export async function fireBingoMilestone(
  milestoneKey: string, // e.g. "row_0", "col_2", "diag_main"
  completedCount: number,
) {
  const N = getNotifications();
  if (!N) return;
  await ensureBingoChannel();

  const key = `milestone_${milestoneKey}`;
  const ids = await loadIds();
  if (ids[key]) return;

  const lineType = milestoneKey.startsWith('row') ? 'row'
    : milestoneKey.startsWith('col') ? 'column'
    : 'diagonal';

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '🎯 BINGO! Line Complete!',
        body: `You completed a ${lineType}! ${completedCount}/25 goals done 🎉`,
        data: { type: 'bingo_milestone', milestoneKey },
        channelId: 'bingo',
        priority: 'max',
      },
      trigger: null,
    });
    ids[key] = id;
    await saveIds(ids);
  } catch (e) {
    console.log('fireBingoMilestone error', e);
  }
}

/** Fire when all 25 goals are completed. */
export async function fireBingoComplete() {
  const N = getNotifications();
  if (!N) return;
  await ensureBingoChannel();

  const key = 'all_complete';
  const ids = await loadIds();
  if (ids[key]) return;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '🏆 Full Bingo Card Complete!',
        body: 'You\'ve completed all 25 goals for 2026! Incredible!',
        data: { type: 'bingo_complete' },
        channelId: 'bingo',
        priority: 'max',
      },
      trigger: null,
    });
    ids[key] = id;
    await saveIds(ids);
  } catch (e) {
    console.log('fireBingoComplete error', e);
  }
}

// ─── 2. Weekly bingo check-in ─────────────────────────────────────────────────

export async function scheduleBingoWeeklyCheckIn(completedCount: number) {
  const N = getNotifications();
  if (!N) return;
  await ensureBingoChannel();
  await cancelById('weekly');

  const remaining = 25 - completedCount;
  const body = completedCount === 25
    ? 'You\'ve completed all 25 goals! 🏆'
    : `${completedCount}/25 goals done — ${remaining} to go!`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '🎯 Weekly Bingo Update',
        body,
        data: { type: 'bingo_weekly' },
        channelId: 'bingo',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes?.WEEKLY ?? 'weekly',
        weekday: 1,
        hour: 19,
        minute: 30,
      },
    });
    const ids = await loadIds();
    ids.weekly = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleBingoWeeklyCheckIn error', e);
  }
}

// ─── 3. Monthly motivation ────────────────────────────────────────────────────

export async function scheduleBingoMonthlyMotivation(completedCount: number) {
  const N = getNotifications();
  if (!N) return;
  await ensureBingoChannel();
  await cancelById('monthly');

  const pct = Math.round((completedCount / 25) * 100);
  const body = `${completedCount}/25 goals complete (${pct}%) — keep pushing!`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '🎯 2026 Bingo Progress',
        body,
        data: { type: 'bingo_monthly' },
        channelId: 'bingo',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes?.MONTHLY ?? 'monthly',
        day: 1,
        hour: 9,
        minute: 0,
      },
    });
    const ids = await loadIds();
    ids.monthly = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleBingoMonthlyMotivation error', e);
  }
}

export async function cancelAllBingoNotifications() {
  await cancelById('weekly');
  await cancelById('monthly');
}
