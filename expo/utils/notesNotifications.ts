/**
 * Notes smart notifications.
 *
 * 1. Pinned notes reminder – 9 AM daily: reminds about pinned notes
 * 2. Note-specific reminder – fires at a user-set time for a specific note
 * 3. Weekly note digest    – Sunday 7 PM: summary of notes activity
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

async function ensureNotesChannel() {
  const N = getNotifications();
  if (!N || Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync('notes', {
    name: 'Notes Reminders',
    description: 'Pinned note reminders and writing prompts',
    importance: N.AndroidImportance.DEFAULT,
    lightColor: '#fbbf24',
  });
}

const STORAGE_KEY = 'notesNotificationIds';

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

// ─── 1. Pinned notes reminder ─────────────────────────────────────────────────

export async function schedulePinnedNotesReminder(pinnedCount: number) {
  const N = getNotifications();
  if (!N || pinnedCount === 0) return;
  await ensureNotesChannel();
  await cancelById('pinned');

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '📌 Pinned Notes',
        body: `You have ${pinnedCount} pinned note${pinnedCount !== 1 ? 's' : ''} to review`,
        data: { type: 'notes_pinned_reminder' },
        channelId: 'notes',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
        hour: 9,
        minute: 0,
      },
    });
    const ids = await loadIds();
    ids.pinned = id;
    await saveIds(ids);
  } catch (e) {
    console.log('schedulePinnedNotesReminder error', e);
  }
}

export async function cancelPinnedNotesReminder() {
  await cancelById('pinned');
}

// ─── 2. Note-specific reminder ────────────────────────────────────────────────

export async function scheduleNoteReminder(
  noteId: number,
  noteTitle: string,
  reminderDate: string,  // ISO date
  reminderTime: string,  // "HH:MM"
) {
  const N = getNotifications();
  if (!N) return;
  await ensureNotesChannel();

  const key = `note_${noteId}`;
  await cancelById(key);

  const reminderMs = new Date(`${reminderDate}T${reminderTime}:00`).getTime();
  if (isNaN(reminderMs) || reminderMs <= Date.now()) return;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '📝 Note Reminder',
        body: noteTitle || 'You have a note reminder',
        data: { type: 'note_reminder', noteId },
        channelId: 'notes',
      },
      trigger: { date: new Date(reminderMs) },
    });
    const ids = await loadIds();
    ids[key] = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleNoteReminder error', e);
  }
}

export async function cancelNoteReminder(noteId: number) {
  await cancelById(`note_${noteId}`);
}

// ─── 3. Weekly note digest ────────────────────────────────────────────────────

export async function scheduleNotesWeeklyDigest(totalNotes: number, newThisWeek: number) {
  const N = getNotifications();
  if (!N) return;
  await ensureNotesChannel();
  await cancelById('weekly');

  const body = newThisWeek > 0
    ? `${newThisWeek} new note${newThisWeek !== 1 ? 's' : ''} this week  •  ${totalNotes} total`
    : `${totalNotes} total note${totalNotes !== 1 ? 's' : ''} — write something new!`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '📓 Weekly Notes Summary',
        body,
        data: { type: 'notes_weekly_digest' },
        channelId: 'notes',
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
    console.log('scheduleNotesWeeklyDigest error', e);
  }
}

export async function cancelAllNotesNotifications() {
  const ids = await loadIds();
  const N = getNotifications();
  for (const key of Object.keys(ids)) {
    if (N) try { await N.cancelScheduledNotificationAsync(ids[key]); } catch { /* ignore */ }
  }
  try { await AsyncStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
