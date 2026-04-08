/**
 * Natural language command parser for Zenith.
 *
 * Understands commands like:
 *   "add task buy milk tomorrow high priority"
 *   "note call mom back"
 *   "add priority finish the report"
 *   "remind me to take medicine at 8am"
 *   "schedule dentist appointment next tuesday at 2pm"
 */

export type ParsedIntent = 'task' | 'note' | 'priority' | 'event' | 'unknown';

export interface ParsedCommand {
  type: ParsedIntent;
  name: string;
  desc?: string;
  date?: string;
  time?: string;
  priority: 'low' | 'medium' | 'high';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function nextWeekday(dayIndex: number): string {
  const today = new Date();
  const current = today.getDay();
  let diff = dayIndex - current;
  if (diff <= 0) diff += 7;
  const target = new Date(today);
  target.setDate(today.getDate() + diff);
  return toDateStr(target);
}

function parseTimeStr(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3]?.toLowerCase();
  if (mer === 'pm' && hours !== 12) hours += 12;
  if (mer === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseCommand(input: string): ParsedCommand {
  let text = input.trim();
  const lower = text.toLowerCase();

  // ── Detect intent ───────────────────────────────────────────────────────────
  let type: ParsedIntent = 'unknown';
  const taskPrefixes = /^(add\s+task|task|create\s+task|new\s+task|remind\s+me\s+to|reminder|to[-\s]?do|todo)\b/i;
  const notePrefixes = /^(add\s+note|note|notes|write\s+(a\s+)?note|make\s+(a\s+)?note|jot(\s+down)?|remember|write)\b/i;
  const priorityPrefixes = /^(add\s+priority|priority|top\s+priority)\b/i;
  const eventPrefixes = /^(add\s+event|event|schedule|calendar\s+event|appointment)\b/i;

  if (taskPrefixes.test(lower)) {
    type = 'task';
    text = text.replace(taskPrefixes, '').trim();
  } else if (notePrefixes.test(lower)) {
    type = 'note';
    text = text.replace(notePrefixes, '').trim();
  } else if (priorityPrefixes.test(lower)) {
    type = 'priority';
    text = text.replace(priorityPrefixes, '').trim();
  } else if (eventPrefixes.test(lower)) {
    type = 'event';
    text = text.replace(eventPrefixes, '').trim();
  } else {
    // Default to task when no prefix matches
    type = 'task';
  }

  // ── Extract priority ─────────────────────────────────────────────────────────
  let priority: 'low' | 'medium' | 'high' = 'medium';
  if (/\b(high\s+priority|urgent|important|asap|critical)\b/i.test(text)) {
    priority = 'high';
    text = text.replace(/\s*\b(high\s+priority|urgent|important|asap|critical)\b/gi, '').trim();
  } else if (/\b(low\s+priority|whenever|no\s+rush)\b/i.test(text)) {
    priority = 'low';
    text = text.replace(/\s*\b(low\s+priority|whenever|no\s+rush)\b/gi, '').trim();
  } else if (/\b(medium\s+priority|medium|normal)\b/i.test(text)) {
    text = text.replace(/\s*\b(medium\s+priority|medium|normal)\b/gi, '').trim();
  }

  // ── Extract time ─────────────────────────────────────────────────────────────
  let time: string | undefined;
  // Matches "at 3pm", "at 3:30 pm", "at noon", "at midnight", "at 14:00"
  const timePattern = /\bat\s+(noon|midnight|\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i;
  const timeMatch = text.match(timePattern);
  if (timeMatch) {
    const raw = timeMatch[1].trim().toLowerCase();
    if (raw === 'noon') {
      time = '12:00';
    } else if (raw === 'midnight') {
      time = '00:00';
    } else {
      time = parseTimeStr(raw) ?? undefined;
    }
    text = text.replace(timeMatch[0], '').trim();
  }

  // ── Extract date ─────────────────────────────────────────────────────────────
  let date: string | undefined;
  const now = new Date();

  if (/\btoday\b/i.test(text)) {
    date = toDateStr(now);
    text = text.replace(/\s*\btoday\b/gi, '').trim();
  } else if (/\btomorrow\b/i.test(text)) {
    const t = new Date(now); t.setDate(t.getDate() + 1);
    date = toDateStr(t);
    text = text.replace(/\s*\btomorrow\b/gi, '').trim();
  } else if (/\bnext\s+week\b/i.test(text)) {
    const t = new Date(now); t.setDate(t.getDate() + 7);
    date = toDateStr(t);
    text = text.replace(/\s*\bnext\s+week\b/gi, '').trim();
  } else if (/\bthis\s+weekend\b/i.test(text)) {
    date = nextWeekday(6); // Saturday
    text = text.replace(/\s*\bthis\s+weekend\b/gi, '').trim();
  } else {
    // "in X days"
    const inDays = text.match(/\bin\s+(\d+)\s+days?\b/i);
    if (inDays) {
      const t = new Date(now); t.setDate(t.getDate() + parseInt(inDays[1], 10));
      date = toDateStr(t);
      text = text.replace(inDays[0], '').trim();
    } else {
      // Named weekdays: monday, tuesday, …
      const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      for (let i = 0; i < dayNames.length; i++) {
        const pat = new RegExp(`\\b(?:next\\s+)?${dayNames[i]}\\b`, 'i');
        if (pat.test(text)) {
          date = nextWeekday(i);
          text = text.replace(pat, '').trim();
          break;
        }
      }
    }
  }

  // ── Clean up trailing filler words ──────────────────────────────────────────
  text = text.replace(/\s*\b(on|by|at|for|in|the)\s*$/gi, '').trim();
  // Collapse extra spaces
  text = text.replace(/\s+/g, ' ').trim();

  return {
    type,
    name: text || input.trim(),
    date,
    time,
    priority,
  };
}

// ─── Human-readable summary ───────────────────────────────────────────────────

export function describeCommand(cmd: ParsedCommand): string {
  const typeLabels: Record<ParsedIntent, string> = {
    task: 'Task',
    note: 'Note',
    priority: 'Top Priority',
    event: 'Event',
    unknown: 'Item',
  };
  let s = `${typeLabels[cmd.type]}: "${cmd.name}"`;
  if (cmd.date) {
    const d = new Date(cmd.date + 'T12:00:00');
    s += `  •  ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
  }
  if (cmd.time) s += ` at ${cmd.time}`;
  if (cmd.type === 'task' && cmd.priority !== 'medium') s += `  •  ${cmd.priority} priority`;
  return s;
}
