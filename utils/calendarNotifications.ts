/**
 * Calendar smart notifications.
 *
 * 1. Daily agenda       – 8 AM daily: "You have X events today"
 * 2. Upcoming event alert – fires ~1 hour before an event (by event ID)
 * 3. Weekly preview     – Sunday 7 PM: events coming up next week
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
      description: 'Daily agenda summaries and event reminders',
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

// ─── 1. Daily agenda ──────────────────────────────────────────────────────────

export async function scheduleCalendarDailyAgenda(
  eventCount: number,
  firstEventName: string,
) {
  const N = getNotifications();
  if (!N) return;
  await ensureCalendarChannel();
  await cancelById('daily');

  const body = eventCount === 0
    ? 'No events scheduled today'
    : eventCount === 1
      ? `1 event today: ${firstEventName}`
      : `${eventCount} events today — starting with: ${firstEventName}`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '📅 Today\'s Agenda',
        body,
        data: { type: 'calendar_daily_agenda' },
        channelId: 'calendar',
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
    console.log('scheduleCalendarDailyAgenda error', e);
  }
}

export async function cancelCalendarDailyAgenda() {
  await cancelById('daily');
}

// ─── 2. Upcoming event alert (1 hour before) ──────────────────────────────────

export async function scheduleEventReminder(
  eventId: number,
  eventName: string,
  eventDate: string,  // ISO date string
  eventTime: string,  // "HH:MM"
) {
  const N = getNotifications();
  if (!N || !eventTime) return;
  await ensureCalendarChannel();

  const key = `event_${eventId}`;
  await cancelById(key);

  const [hour, minute] = eventTime.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute)) return;

  // Schedule 60 minutes before
  const eventMs = new Date(`${eventDate}T${eventTime}:00`).getTime();
  const reminderMs = eventMs - 60 * 60 * 1000;
  if (reminderMs <= Date.now()) return; // already past

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '⏰ Event starting soon',
        body: `"${eventName}" starts in 1 hour`,
        data: { type: 'event_reminder', eventId },
        channelId: 'calendar',
        priority: 'high',
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

// ─── 3. Weekly preview ────────────────────────────────────────────────────────

export async function scheduleCalendarWeeklyPreview(nextWeekCount: number) {
  const N = getNotifications();
  if (!N) return;
  await ensureCalendarChannel();
  await cancelById('weekly');

  const body = nextWeekCount === 0
    ? 'No events scheduled for next week'
    : `${nextWeekCount} event${nextWeekCount !== 1 ? 's' : ''} coming up next week`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '📅 Weekly Preview',
        body,
        data: { type: 'calendar_weekly_preview' },
        channelId: 'calendar',
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
    console.log('scheduleCalendarWeeklyPreview error', e);
  }
}

export async function cancelAllCalendarNotifications() {
  const ids = await loadIds();
  const N = getNotifications();
  for (const key of Object.keys(ids)) {
    if (N) try { await N.cancelScheduledNotificationAsync(ids[key]); } catch { /* ignore */ }
  }
  try { await AsyncStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
