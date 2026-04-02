/**
 * Calendar sync via iCal / ICS URL
 *
 * No OAuth, no Google Cloud Console setup required.
 *
 * HOW TO GET YOUR ICAL URL (Google Calendar):
 *  1. Open Google Calendar on the web
 *  2. Settings (⚙) → Settings for my calendars → click your calendar name
 *  3. Scroll to "Integrate calendar"
 *  4. Copy the "Private address in iCal format" link  (ends in .ics)
 *  5. Paste it into the app when prompted
 *
 * This URL works with Google Calendar, Apple Calendar, Outlook, and any
 * calendar service that supports the iCal/ICS format.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Event } from '@/types';

// ─── Storage keys ─────────────────────────────────────────────────────────────
export const ICAL_URL_KEY          = 'icalSyncUrl';
export const GOOGLE_SYNCED_IDS_KEY = 'googleSyncedEventIds';

// ─── URL helpers ──────────────────────────────────────────────────────────────

export async function getStoredICalUrl(): Promise<string | null> {
  try { return await AsyncStorage.getItem(ICAL_URL_KEY); } catch { return null; }
}

export async function saveICalUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(ICAL_URL_KEY, url.trim());
}

export async function signOut(): Promise<void> {
  await AsyncStorage.multiRemove([ICAL_URL_KEY, GOOGLE_SYNCED_IDS_KEY]);
}

// ─── ICS parser ───────────────────────────────────────────────────────────────

interface ICSEvent {
  uid: string;
  summary: string;
  description: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM or ''
}

function parseDT(value: string): { date: string; time: string } {
  const v = value.trim();
  if (v.length === 8) {
    // All-day: YYYYMMDD
    return { date: `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`, time: '' };
  }
  // Datetime: YYYYMMDDTHHMMSS[Z]
  const datePart = v.slice(0, 8);
  const timePart = v.slice(9, 15);
  const date = `${datePart.slice(0,4)}-${datePart.slice(4,6)}-${datePart.slice(6,8)}`;
  const hh = timePart.slice(0, 2);
  const mm = timePart.slice(2, 4);
  const ss = timePart.slice(4, 6) || '00';

  if (v.endsWith('Z')) {
    // UTC → device local time
    const d = new Date(`${date}T${hh}:${mm}:${ss}Z`);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    };
  }
  return { date, time: `${hh}:${mm}` };
}

function unescape(s: string): string {
  return s.replace(/\\n/g, ' ').replace(/\\N/g, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function parseICS(text: string): ICSEvent[] {
  // Unfold RFC 5545 continuation lines
  const unfolded = text.replace(/\r\n([ \t])/g, '').replace(/\n([ \t])/g, '');
  const lines = unfolded.split(/\r?\n/);

  const events: ICSEvent[] = [];
  let inEvent = false;
  let uid = '';
  let summary = '';
  let description = '';
  let dtstart = '';

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      uid = '';
      summary = '';
      description = '';
      dtstart = '';
      continue;
    }
    if (line === 'END:VEVENT') {
      if (inEvent && summary && dtstart) {
        const { date, time } = parseDT(dtstart);
        if (date) {
          events.push({ uid: uid || `ics-${Date.now()}-${Math.random()}`, summary, description, date, time });
        }
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const rawProp = line.slice(0, colonIdx);
    const value   = line.slice(colonIdx + 1);
    // Property name is before the first ';'
    const semiIdx = rawProp.indexOf(';');
    const prop    = (semiIdx >= 0 ? rawProp.slice(0, semiIdx) : rawProp).toUpperCase();

    switch (prop) {
      case 'UID':         uid         = value; break;
      case 'SUMMARY':     summary     = unescape(value); break;
      case 'DESCRIPTION': description = unescape(value); break;
      case 'DTSTART':     dtstart     = value; break;
    }
  }

  return events;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncResult {
  added: number;
  skipped: number;
  error?: string;
}

/**
 * Fetch an ICS URL and import upcoming events into the app.
 * Already-seen events (by UID or name+date) are skipped.
 */
export async function syncFromICalUrl(
  url: string,
  addEvent: (event: Omit<Event, 'id' | 'createdDate'>) => void,
  existingEvents: Event[],
): Promise<SyncResult> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { added: 0, skipped: 0, error: `HTTP ${res.status} – check your iCal URL` };

    const icsText = await res.text();
    if (!icsText.includes('BEGIN:VCALENDAR')) {
      return { added: 0, skipped: 0, error: 'Not a valid iCal file. Double-check the URL.' };
    }

    const parsed = parseICS(icsText);

    // Only import events from the past 7 days onward
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const raw = await AsyncStorage.getItem(GOOGLE_SYNCED_IDS_KEY);
    const syncedIds = new Set<string>(raw ? JSON.parse(raw) : []);

    let added = 0;
    let skipped = 0;
    const newSyncedIds = new Set(syncedIds);

    for (const ev of parsed) {
      if (!ev.date || ev.date < cutoff) { skipped++; continue; }
      if (syncedIds.has(ev.uid)) { skipped++; continue; }

      const exists = existingEvents.some(e => e.name === ev.summary && e.date === ev.date);
      if (exists) { newSyncedIds.add(ev.uid); skipped++; continue; }

      addEvent({ name: ev.summary, desc: ev.description, date: ev.date, time: ev.time, recurring: 'none', reminderBefore: 60 });
      newSyncedIds.add(ev.uid);
      added++;
    }

    await AsyncStorage.setItem(GOOGLE_SYNCED_IDS_KEY, JSON.stringify([...newSyncedIds]));
    return { added, skipped };
  } catch (e: any) {
    return { added: 0, skipped: 0, error: e?.message ?? 'Network error – check your connection' };
  }
}
