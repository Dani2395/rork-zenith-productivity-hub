/**
 * Gifts smart notifications.
 *
 * 1. Upcoming event alert  – fires when a gift event is ≤ 14 days away
 * 2. Monthly gift reminder – 1st of each month at 10 AM
 * 3. Weekly gift digest    – Sunday 7 PM: unpurchased gifts summary
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

async function ensureGiftsChannel() {
  const N = getNotifications();
  if (!N) return;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('gifts', {
      name: 'Gift Reminders',
      description: 'Upcoming event alerts and gift planning reminders',
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#ec4899',
    });
  }
}

const STORAGE_KEY = 'giftsNotificationIds';

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

// ─── 1. Upcoming event alert ──────────────────────────────────────────────────

/**
 * Fire an immediate notification when a gift event is within 14 days.
 * Only fires once per unique person+event combination.
 */
export async function fireUpcomingGiftAlert(
  personName: string,
  eventType: string,
  daysUntil: number,
  unpurchasedCount: number,
) {
  const N = getNotifications();
  if (!N || daysUntil > 14 || daysUntil < 0) return;
  await ensureGiftsChannel();

  const key = `gift_${personName}_${eventType}`;
  const ids = await loadIds();
  if (ids[key]) return; // already fired

  const urgency = daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
  const giftNote = unpurchasedCount > 0
    ? `  •  ${unpurchasedCount} gift${unpurchasedCount !== 1 ? 's' : ''} still needed`
    : '  •  All gifts purchased! 🎉';

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: `🎁 ${eventType} Alert — ${personName}`,
        body: `${personName}'s ${eventType} is ${urgency}${giftNote}`,
        data: { type: 'gift_event_alert', personName, eventType },
        channelId: 'gifts',
        priority: daysUntil <= 3 ? 'max' : 'high',
      },
      trigger: null,
    });
    ids[key] = id;
    await saveIds(ids);
  } catch (e) {
    console.log('fireUpcomingGiftAlert error', e);
  }
}

// ─── 2. Monthly gift reminder ─────────────────────────────────────────────────

export async function scheduleGiftsMonthlyReminder(unpurchasedTotal: number) {
  const N = getNotifications();
  if (!N) return;
  await ensureGiftsChannel();
  await cancelById('monthly');

  const body = unpurchasedTotal > 0
    ? `${unpurchasedTotal} gift${unpurchasedTotal !== 1 ? 's' : ''} still unpurchased — check your list!`
    : 'All gifts are purchased — great job planning ahead!';

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '🎁 Monthly Gift Check',
        body,
        data: { type: 'gifts_monthly' },
        channelId: 'gifts',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes?.MONTHLY ?? 'monthly',
        day: 1,
        hour: 10,
        minute: 0,
      },
    });
    const ids = await loadIds();
    ids.monthly = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleGiftsMonthlyReminder error', e);
  }
}

export async function cancelGiftsMonthlyReminder() {
  await cancelById('monthly');
}

// ─── 3. Weekly gift digest ────────────────────────────────────────────────────

export async function scheduleGiftsWeeklyDigest(
  totalGifts: number,
  purchasedCount: number,
) {
  const N = getNotifications();
  if (!N) return;
  await ensureGiftsChannel();
  await cancelById('weekly');

  const remaining = totalGifts - purchasedCount;
  const body = remaining === 0
    ? `All ${totalGifts} gifts purchased — nothing to worry about!`
    : `${remaining} of ${totalGifts} gifts still unpurchased`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '🎁 Weekly Gift Update',
        body,
        data: { type: 'gifts_weekly' },
        channelId: 'gifts',
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
    console.log('scheduleGiftsWeeklyDigest error', e);
  }
}

export async function cancelAllGiftsNotifications() {
  await cancelById('monthly');
  await cancelById('weekly');
}
