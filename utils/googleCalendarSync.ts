/**
 * Google Calendar Sync
 *
 * Uses expo-auth-session to authenticate with Google via OAuth 2.0,
 * then fetches events from the Google Calendar API and maps them to
 * the app's Event format.
 *
 * SETUP (one-time):
 *  1. Go to https://console.cloud.google.com
 *  2. Create a project → Enable "Google Calendar API"
 *  3. OAuth consent screen → External → add your email as test user
 *  4. Credentials → Create OAuth Client ID → Application type: Android
 *     - Package name: app.rork.zenith_productivity_hub
 *     - SHA-1: get it with `eas credentials` or keytool
 *  5. Also create an "iOS" client (needed for expo-auth-session)
 *  6. Paste the Client IDs below.
 */

import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleEventReminder } from './calendarNotifications';
import type { Event } from '@/types';

// ─── Replace these with your own Google OAuth Client IDs ──────────────────────
export const GOOGLE_CLIENT_ID_ANDROID = '188861853335-73q8n9tulraa9ch1m6cepv32mfqrt27k.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_IOS     = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_WEB     = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
// ─────────────────────────────────────────────────────────────────────────────

export const GOOGLE_SYNCED_IDS_KEY = 'googleSyncedEventIds';
export const GOOGLE_TOKEN_KEY      = 'googleAccessToken';
export const GOOGLE_TOKEN_EXP_KEY  = 'googleTokenExpiry';

export function isConfigured(): boolean {
  return (
    GOOGLE_CLIENT_ID_ANDROID !== 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com' ||
    GOOGLE_CLIENT_ID_IOS     !== 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com'
  );
}

/** Returns a valid cached token or null */
async function getCachedToken(): Promise<string | null> {
  try {
    const token  = await AsyncStorage.getItem(GOOGLE_TOKEN_KEY);
    const expiry = await AsyncStorage.getItem(GOOGLE_TOKEN_EXP_KEY);
    if (token && expiry && Date.now() < parseInt(expiry, 10)) return token;
  } catch { /* ignore */ }
  return null;
}

async function saveToken(token: string, expiresIn: number) {
  await AsyncStorage.setItem(GOOGLE_TOKEN_KEY, token);
  await AsyncStorage.setItem(GOOGLE_TOKEN_EXP_KEY, String(Date.now() + expiresIn * 1000));
}

export async function signOut() {
  await AsyncStorage.multiRemove([GOOGLE_TOKEN_KEY, GOOGLE_TOKEN_EXP_KEY, GOOGLE_SYNCED_IDS_KEY]);
}

/** Parse a Google Calendar datetime into { date, time } for the app */
function parseGoogleDateTime(dt: { date?: string; dateTime?: string; timeZone?: string }): { date: string; time: string } {
  if (dt.date) {
    // All-day event
    return { date: dt.date, time: '' };
  }
  if (dt.dateTime) {
    const d = new Date(dt.dateTime);
    const date = d.toISOString().split('T')[0];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return { date, time: `${hh}:${mm}` };
  }
  return { date: '', time: '' };
}

/** Map a Google Calendar event object → app Event (minus id/createdDate) */
function mapGoogleEvent(g: any): Omit<Event, 'id' | 'createdDate'> {
  const { date, time } = parseGoogleDateTime(g.start ?? {});
  return {
    name: g.summary ?? '(No title)',
    desc: [g.description, g.location].filter(Boolean).join(' · ') ?? '',
    date,
    time,
    recurring: 'none',
    reminderBefore: 60,
  };
}

export interface SyncResult {
  added: number;
  skipped: number;
  error?: string;
}

/**
 * Full sync: authenticate → fetch upcoming Google Calendar events →
 * add any new ones to the app, schedule notifications, return counts.
 *
 * @param accessToken  Already-authenticated token (from the hook result)
 * @param addEvent     DataContext addEvent function
 * @param existingEvents  Current app events array (for dedup)
 */
export async function syncGoogleCalendar(
  accessToken: string,
  addEvent: (event: Omit<Event, 'id' | 'createdDate'>) => void,
  existingEvents: Event[],
): Promise<SyncResult> {
  try {
    // Save token for future use
    await saveToken(accessToken, 3600);

    // Load previously synced Google IDs to avoid duplicates
    const raw = await AsyncStorage.getItem(GOOGLE_SYNCED_IDS_KEY);
    const syncedIds: Set<string> = new Set(raw ? JSON.parse(raw) : []);

    // Fetch events: next 30 days from today
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
      `?timeMin=${encodeURIComponent(timeMin)}` +
      `&timeMax=${encodeURIComponent(timeMax)}` +
      `&singleEvents=true&orderBy=startTime&maxResults=100`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { added: 0, skipped: 0, error: err?.error?.message ?? `HTTP ${res.status}` };
    }

    const data = await res.json();
    const googleEvents: any[] = data.items ?? [];

    let added = 0;
    let skipped = 0;
    const newSyncedIds = new Set(syncedIds);

    for (const g of googleEvents) {
      const gId: string = g.id ?? '';
      if (!gId || syncedIds.has(gId)) {
        skipped++;
        continue;
      }

      // Also skip if an event with the same name+date already exists
      const mapped = mapGoogleEvent(g);
      if (!mapped.date) { skipped++; continue; }

      const alreadyExists = existingEvents.some(
        e => e.name === mapped.name && e.date === mapped.date,
      );
      if (alreadyExists) {
        newSyncedIds.add(gId);
        skipped++;
        continue;
      }

      addEvent(mapped);
      newSyncedIds.add(gId);
      added++;
    }

    await AsyncStorage.setItem(GOOGLE_SYNCED_IDS_KEY, JSON.stringify([...newSyncedIds]));
    return { added, skipped };
  } catch (e: any) {
    return { added: 0, skipped: 0, error: e?.message ?? 'Unknown error' };
  }
}

/**
 * Hook that wraps expo-auth-session Google OAuth.
 * Call `promptAsync()` to open the consent screen.
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    iosClientId:     GOOGLE_CLIENT_ID_IOS,
    webClientId:     GOOGLE_CLIENT_ID_WEB,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  return { request, response, promptAsync };
}
