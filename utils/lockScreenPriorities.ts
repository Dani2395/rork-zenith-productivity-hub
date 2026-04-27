/**
 * Lock screen priorities — persistent notification.
 *
 * Android lock screen widgets were removed in Android 5.0. The correct modern
 * approach is a persistent (ongoing) notification with lockscreen visibility
 * set to PUBLIC so the full content is visible on the lock screen without
 * unlocking the device.
 *
 * The notification is updated every time priorities change and shows:
 *   • Up to 5 priority items with a ✓ or • prefix
 *   • A progress line: "X / Y done"
 *   • Tapping opens the app at the priorities screen
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let N: any = null;
function getN() {
  if (!N) {
    try { N = require('expo-notifications'); } catch { /* unavailable */ }
  }
  return N;
}

const CHANNEL_ID   = 'lock_screen_priorities';
const NOTIF_ID_KEY = 'lockScreenPrioritiesNotifId';
// Fixed identifier so we always update the same notification slot
const FIXED_ID     = 88421;

async function ensureChannel() {
  const n = getN();
  if (!n || Platform.OS !== 'android') return;
  await n.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lock Screen Priorities',
    description: 'Persistent top-5 priority list visible on your lock screen',
    importance: n.AndroidImportance.LOW,   // LOW = no sound/vibration, stays in tray
    lockscreenVisibility: n.AndroidNotificationVisibility?.PUBLIC ?? 1,
    showBadge: false,
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
  if (!n) return;

  if (Platform.OS !== 'android') return;

  await ensureChannel();

  const top5 = priorities.slice(0, 5);
  const completedCount = top5.filter(p => p.completed).length;
  const totalCount = top5.length;

  if (totalCount === 0) {
    await dismissLockScreenPrioritiesNotification();
    return;
  }

  // Build body lines: ✓ for done, ⚠ for overdue, • for pending
  const lines = top5.map(p => {
    const prefix = p.completed ? '✓' : p.overdue ? '⚠' : '•';
    return `${prefix}  ${p.task}`;
  });
  const body = lines.join('\n');
  const subText = `${completedCount} / ${totalCount} done`;

  try {
    // presentNotificationAsync assigns a new ID every call; we use
    // scheduleNotificationAsync with no trigger (immediate) and a fixed
    // identifier via the identifier field so Android updates in-place.
    await n.scheduleNotificationAsync({
      identifier: String(FIXED_ID),
      content: {
        title: '⭐ Top 5 Priorities',
        body,
        subtitle: subText,
        data: { type: 'lock_screen_priorities', url: 'rork-app:///' },
        channelId: CHANNEL_ID,
        sticky: true,
        autoDismiss: false,
        ...(Platform.OS === 'android' ? {
          priority: 'low',
          vibrate: [],
          sound: false,
        } : {}),
      },
      trigger: null,
    });

    await AsyncStorage.setItem(NOTIF_ID_KEY, String(FIXED_ID));
  } catch (e) {
    console.log('lockScreenPriorities update error', e);
  }
}

export async function dismissLockScreenPrioritiesNotification(): Promise<void> {
  const n = getN();
  if (!n) return;
  try {
    await n.dismissNotificationAsync(String(FIXED_ID));
    await AsyncStorage.removeItem(NOTIF_ID_KEY);
  } catch { /* ignore */ }
}
