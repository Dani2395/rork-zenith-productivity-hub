/**
 * Tasks notifications.
 * Fires only for tasks due at their scheduled time and overdue alerts.
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
      description: 'Notifications for tasks due at their scheduled time and overdue tasks',
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

function priorityIcon(priority: string) {
  if (priority === 'high') return '🔴';
  if (priority === 'medium') return '🟡';
  return '🔵';
}

function formatTime(time: string) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// ─── Schedule due reminder for a specific task ────────────────────────────────

export async function scheduleTaskDueReminder(
  taskId: number,
  taskName: string,
  priority: 'low' | 'medium' | 'high',
  dueDate: string,   // YYYY-MM-DD
  dueTime: string,   // "HH:MM" — defaults to "08:00" if empty
  minutesBefore = 0,
) {
  const N = getNotifications();
  if (!N || !dueDate) return;
  await ensureTasksChannel();

  const key = `due_${taskId}`;
  await cancelById(key);

  const timeStr = dueTime || '08:00';
  const dueMs = new Date(`${dueDate}T${timeStr}:00`).getTime();
  const triggerMs = dueMs - minutesBefore * 60 * 1000;
  if (triggerMs <= Date.now()) return; // already past

  const icon = priorityIcon(priority);
  const timeDisplay = formatTime(timeStr);
  const isHighPriority = priority === 'high';

  const title = minutesBefore > 0
    ? `${icon} Due in ${minutesBefore} min${isHighPriority ? ' — High Priority' : ''}`
    : `${icon} Task Due Now${isHighPriority ? ' — High Priority' : ''}`;

  const body = minutesBefore > 0
    ? `"${taskName}" is due at ${timeDisplay}`
    : `"${taskName}" — time to get it done`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'task_due', taskId },
        channelId: 'tasks',
        sound: true,
      },
      trigger: { date: new Date(triggerMs) },
    });
    const ids = await loadIds();
    ids[key] = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleTaskDueReminder error', e);
  }
}

export async function cancelTaskDueReminder(taskId: number) {
  await cancelById(`due_${taskId}`);
}

// ─── Cancel all scheduled due reminders ──────────────────────────────────────

export async function cancelAllTaskDueReminders() {
  const ids = await loadIds();
  const N = getNotifications();
  const dueKeys = Object.keys(ids).filter(k => k.startsWith('due_'));
  for (const key of dueKeys) {
    if (N) try { await N.cancelScheduledNotificationAsync(ids[key]); } catch { /* ignore */ }
    delete ids[key];
  }
  await saveIds(ids);
}

// ─── Overdue alert (fires immediately) ────────────────────────────────────────

export async function fireOverdueAlert(
  taskName: string,
  taskId: number,
  priority: 'low' | 'medium' | 'high' = 'medium',
) {
  const N = getNotifications();
  if (!N) return;
  await ensureTasksChannel();

  const key = `overdue_${taskId}`;
  const ids = await loadIds();
  if (ids[key]) return; // already fired

  const icon = priorityIcon(priority);

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: `${icon} Overdue Task`,
        body: `"${taskName}" is past its due date — tap to review`,
        data: { type: 'task_overdue', taskId },
        channelId: 'tasks',
        sound: true,
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

// ─── Cancel everything ────────────────────────────────────────────────────────

export async function cancelAllTasksNotifications() {
  const ids = await loadIds();
  const N = getNotifications();
  for (const key of Object.keys(ids)) {
    if (N) try { await N.cancelScheduledNotificationAsync(ids[key]); } catch { /* ignore */ }
  }
  try { await AsyncStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
