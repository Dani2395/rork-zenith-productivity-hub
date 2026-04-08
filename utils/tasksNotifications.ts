/**
 * Tasks smart notifications.
 *
 * 1. Daily morning summary  – 8 AM every day: "You have X tasks due today"
 * 2. Overdue alert          – immediate when a task becomes overdue
 * 3. Weekly digest         – Sunday 7 PM: tasks completed this week
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

async function ensureTasksChannel() {
  const N = getNotifications();
  if (!N) return;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('tasks', {
      name: 'Task Reminders',
      description: 'Daily task summaries, overdue alerts, and weekly digests',
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#6366f1',
    });
  }
}

const STORAGE_KEY = 'tasksNotificationIds';

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

// ─── 1. Daily morning summary ─────────────────────────────────────────────────

export async function scheduleTasksDailySummary(
  todayCount: number,
  overdueCount: number,
) {
  const N = getNotifications();
  if (!N) return;
  await ensureTasksChannel();
  await cancelById('daily');

  const parts: string[] = [];
  if (todayCount > 0) parts.push(`${todayCount} task${todayCount !== 1 ? 's' : ''} due today`);
  if (overdueCount > 0) parts.push(`${overdueCount} overdue`);
  const body = parts.length > 0 ? parts.join('  •  ') : 'No tasks due today — enjoy your day!';

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '✅ Task Check-In',
        body,
        data: { type: 'tasks_daily_summary' },
        channelId: 'tasks',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
        hour: 8,
        minute: 0,
      },
    });
    const ids = await loadIds();
    ids.daily = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleTasksDailySummary error', e);
  }
}

export async function cancelTasksDailySummary() {
  await cancelById('daily');
}

// ─── 2. Overdue alert ─────────────────────────────────────────────────────────

export async function fireOverdueAlert(taskName: string, taskId: number) {
  const N = getNotifications();
  if (!N) return;
  await ensureTasksChannel();

  const key = `overdue_${taskId}`;
  const ids = await loadIds();
  if (ids[key]) return; // already fired

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '⚠️ Task Overdue',
        body: `"${taskName}" is past its due date`,
        data: { type: 'task_overdue', taskId },
        channelId: 'tasks',
        priority: 'high',
      },
      trigger: null,
    });
    ids[key] = id;
    await saveIds(ids);
  } catch (e) {
    console.log('fireOverdueAlert error', e);
  }
}

export async function clearOverdueAlerts() {
  const ids = await loadIds();
  const N = getNotifications();
  const overdueKeys = Object.keys(ids).filter(k => k.startsWith('overdue_'));
  for (const key of overdueKeys) {
    if (N) try { await N.cancelScheduledNotificationAsync(ids[key]); } catch { /* ignore */ }
    delete ids[key];
  }
  await saveIds(ids);
}

// ─── 3. Weekly digest ─────────────────────────────────────────────────────────

export async function scheduleTasksWeeklyDigest(completedThisWeek: number, totalThisWeek: number) {
  const N = getNotifications();
  if (!N) return;
  await ensureTasksChannel();
  await cancelById('weekly');

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '📋 Weekly Task Recap',
        body: `This week: ${completedThisWeek} of ${totalThisWeek} task${totalThisWeek !== 1 ? 's' : ''} completed`,
        data: { type: 'tasks_weekly_digest' },
        channelId: 'tasks',
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
    console.log('scheduleTasksWeeklyDigest error', e);
  }
}

export async function cancelTasksWeeklyDigest() {
  await cancelById('weekly');
}

export async function cancelAllTasksNotifications() {
  await cancelTasksDailySummary();
  await cancelTasksWeeklyDigest();
  await clearOverdueAlerts();
}
