/**
 * Budget-specific smart notifications.
 *
 * Three types:
 *  1. Daily morning summary  – fires every day at 8 AM
 *  2. Budget threshold alert – fires immediately when a budget category hits 80 % or 100 %
 *  3. Weekly digest         – fires every Sunday at 7 PM
 *
 * All IDs are stored in AsyncStorage so we can cancel / replace them.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let Notifications: any = null;

function getNotifications() {
  if (!Notifications) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Notifications = require('expo-notifications');
    } catch {
      /* not available in Expo Go */
    }
  }
  return Notifications;
}

// ─── channel setup ───────────────────────────────────────────────────────────

async function ensureBudgetChannel() {
  const N = getNotifications();
  if (!N) return;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('budget', {
      name: 'Budget Alerts',
      description: 'Daily summaries, budget threshold alerts, and weekly digests',
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#6366f1',
    });
  }
}

// ─── storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'budgetNotificationIds';

async function loadIds(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveIds(ids: Record<string, string>) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
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

/**
 * Schedule (or replace) a repeating daily notification at 8 AM
 * that shows the current-month cashflow.
 */
export async function scheduleDailySummary(
  monthLabel: string,
  income: number,
  expenses: number,
) {
  const N = getNotifications();
  if (!N) return;
  await ensureBudgetChannel();
  await cancelById('daily');

  const cashflow = income - expenses;
  const sign = cashflow >= 0 ? '+' : '';
  const body =
    `Income: +$${income.toFixed(0)}  •  Expenses: -$${expenses.toFixed(0)}\n` +
    `Net cashflow: ${sign}$${cashflow.toFixed(0)}`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: `📊 ${monthLabel} Budget`,
        body,
        data: { type: 'daily_summary' },
        channelId: 'budget',
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
    console.log('scheduleDailySummary error', e);
  }
}

export async function cancelDailySummary() {
  await cancelById('daily');
}

// ─── 2. Budget threshold alert ────────────────────────────────────────────────

/**
 * Fire an immediate notification when a budget category crosses 80 % or 100 %.
 * Only fires once per threshold per budget (tracked by storage key).
 */
export async function fireBudgetAlert(
  budgetName: string,
  spent: number,
  limit: number,
) {
  const N = getNotifications();
  if (!N || limit <= 0) return;
  await ensureBudgetChannel();

  const pct = (spent / limit) * 100;
  const threshold = pct >= 100 ? 100 : pct >= 80 ? 80 : null;
  if (!threshold) return;

  const key = `budget_${budgetName}_${threshold}`;
  const ids = await loadIds();
  if (ids[key]) return; // already fired for this threshold

  const title =
    threshold === 100
      ? `🚨 Budget exceeded — ${budgetName}`
      : `⚠️ Budget alert — ${budgetName}`;
  const body =
    threshold === 100
      ? `You've used $${spent.toFixed(0)} of your $${limit.toFixed(0)} budget (${pct.toFixed(0)}%)`
      : `You've used ${pct.toFixed(0)}% of your $${limit.toFixed(0)} ${budgetName} budget`;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'budget_alert', budgetName, threshold },
        channelId: 'budget',
        priority: threshold === 100 ? 'max' : 'high',
      },
      trigger: null, // fire immediately
    });
    ids[key] = id;
    await saveIds(ids);
  } catch (e) {
    console.log('fireBudgetAlert error', e);
  }
}

/** Call when a new month starts to clear past-month threshold records. */
export async function clearBudgetAlerts() {
  const N = getNotifications();
  if (!N) return;
  const ids = await loadIds();
  const budgetKeys = Object.keys(ids).filter(k => k.startsWith('budget_'));
  for (const key of budgetKeys) {
    try { await N.cancelScheduledNotificationAsync(ids[key]); } catch { /* ignore */ }
    delete ids[key];
  }
  await saveIds(ids);
}

// ─── 3. Weekly digest ─────────────────────────────────────────────────────────

/**
 * Schedule (or replace) a weekly Sunday-evening notification
 * summarising the week's income and expenses.
 */
export async function scheduleWeeklyDigest(
  weekIncome: number,
  weekExpenses: number,
) {
  const N = getNotifications();
  if (!N) return;
  await ensureBudgetChannel();
  await cancelById('weekly');

  const cashflow = weekIncome - weekExpenses;
  const sign = cashflow >= 0 ? '+' : '';

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: '📅 Weekly Finance Digest',
        body:
          `This week: +$${weekIncome.toFixed(0)} income  •  -$${weekExpenses.toFixed(0)} expenses\n` +
          `Net: ${sign}$${cashflow.toFixed(0)}`,
        data: { type: 'weekly_digest' },
        channelId: 'budget',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes?.WEEKLY ?? 'weekly',
        weekday: 1,   // Sunday (Expo uses 1 = Sunday)
        hour: 19,
        minute: 0,
      },
    });
    const ids = await loadIds();
    ids.weekly = id;
    await saveIds(ids);
  } catch (e) {
    console.log('scheduleWeeklyDigest error', e);
  }
}

export async function cancelWeeklyDigest() {
  await cancelById('weekly');
}

// ─── cancel everything ────────────────────────────────────────────────────────

export async function cancelAllBudgetNotifications() {
  await cancelDailySummary();
  await cancelWeeklyDigest();
  await clearBudgetAlerts();
}
