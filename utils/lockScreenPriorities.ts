/**
 * Lock screen priorities — persistent notification.
 *
 * Android lock screen widgets were removed in Android 5.0. The correct modern
 * approach is a persistent (ongoing) notification with lockscreen visibility
 * set to PUBLIC so the full content is visible on the lock screen without
 * unlocking the device. This is how Todoist, Any.do, and Google Tasks handle it.
 *
 * The notification is updated every time priorities change and shows:
 *   • Up to 5 priority items with a ✓ / ⚠ / • prefix
 *   • A "X / Y done" count in the sub-text
 *   • Tapping opens the app
 *
 * Implementation note: expo-notifications re-posts a notification in-place
 * when scheduleNotificationAsync is called with the same identifier string,
 * because Android's NotificationManager.notify() replaces notifications
 * sharing the same integer ID (derived from the identifier hash).
 */

import { Platform } from 'react-native';

let N: any = null;
function getN() {
  if (!N) {
    try { N = require('expo-notifications'); } catch { /* unavailable in Expo Go */ }
  }
  return N;
}

const CHANNEL_ID = 'lock_screen_priorities';
const NOTIF_IDENTIFIER = 'lock_screen_priorities_pinned';

async function ensureChannel() {
  const n = getN();
  if (!n || Platform.OS !== 'android') return;
  await n.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lock Screen Priorities',
    description: 'Persistent top-5 priority list shown on your lock screen',
    importance: n.AndroidImportance.LOW,  // silent, no vibration, stays in tray
    lockscreenVisibility: n.AndroidNotificationVisibility?.PUBLIC ?? 1,
    showBadge: false,
    sound: null,
    vibrationPattern: null,
  });
}

export interface LockScreenPriorityItem {
  task: string;
  completed: boolean;
  overdue: boolean;
}

export async function updateLockScreenPrioritiesNotification(
  priorities: LockScreenPriorityItem[],
): Promise<void> {
  const n = getN();
  if (!n || Platform.OS !== 'android') return;

  await ensureChannel();

  const top5 = priorities.slice(0, 5);
  const completedCount = top5.filter(p => p.completed).length;
  const totalCount = top5.length;

  if (totalCount === 0) {
    await dismissLockScreenPrioritiesNotification();
    return;
  }

  // ✓ = done, ⚠ = overdue, • = pending
  const body = top5
    .map(p => `${p.completed ? '✓' : p.overdue ? '⚠' : '•'}  ${p.task}`)
    .join('\n');

  try {
    await n.scheduleNotificationAsync({
      identifier: NOTIF_IDENTIFIER,
      content: {
        title: '⭐ Top 5 Priorities',
        body,
        subtitle: `${completedCount} / ${totalCount} done`,
        data: { type: 'lock_screen_priorities' },
        channelId: CHANNEL_ID,
        // Android-specific: keep it pinned
        sticky: true,
        autoDismiss: false,
        sound: false,
        vibrate: false,
        priority: 'low',
      },
      trigger: null,
    });
  } catch (e) {
    console.log('lockScreenPriorities update error', e);
  }
}

export async function dismissLockScreenPrioritiesNotification(): Promise<void> {
  const n = getN();
  if (!n) return;
  try {
    await n.dismissNotificationAsync(NOTIF_IDENTIFIER);
  } catch { /* ignore if not present */ }
}
