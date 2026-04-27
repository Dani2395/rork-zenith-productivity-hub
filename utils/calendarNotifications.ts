/**
 * Calendar notifications.
 * Fires a reminder before each upcoming event (default 15 minutes before).
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

async function ensureCalendarChannel() {
  const N = getNotifications();
  if (!N) return;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('calendar', {
      name: 'Calendar Reminders',
      description: 'Reminders for upcoming calendar events',
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 100, 250],
      lightColor: '#818cf8',
    });
  }
}

const STORAGE_KEY = 'calendarNotificationIds';

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

function formatTime(time: string) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// ─── Per-event reminder ───────────────────────────────────────────────────────

export async function scheduleEventReminder(
  eventId: number,
  eventName: string,
  eventDate: string,  // YYYY-MM-DD
  eventTime: string,  // "HH:MM"
  minutesBefore = 15,
) {
  const N = getNotifications();
  if (!N || !eventTime) return;
  await ensureCalendarChannel();

  const key = `event_${eventId}`;
  await cancelById(key);

  const eventMs = new Date(`${eventDate}T${eventTime}:00`).getTime();
  const reminderMs = eventMs - minutesBefore * 60 * 1000;
  if (reminderMs <= Date.now()) return; // already past

  const timeDisplay = formatTime(eventTime);

  const title = minutesBefore > 0
    ? `📅 Starting in ${minutesBefore} min`
    : `📅 Event Starting Now`;

  const body = minutesBefore > 0
    ? `"${eventName}" starts at ${timeDisplay}`
    : `"${eventName}" is starting now`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'event_reminder', eventId },
        channelId: 'calendar',
        sound: true,
      },
      trigger: { date: new Date(reminderMs) },
    });
    const ids = await loadIds();
    ids[key] = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleEventReminder error', e);
  }
}

export async function cancelEventReminder(eventId: number) {
  await cancelById(`event_${eventId}`);
}

// ─── Cancel everything ────────────────────────────────────────────────────────

export async function cancelAllCalendarNotifications() {
  const ids = await loadIds();
  const N = getNotifications();
  for (const key of Object.keys(ids)) {
    if (N) try { await N.cancelScheduledNotificationAsync(ids[key]); } catch { /* ignore */ }
  }
  try { await AsyncStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
