/**
 * Android widget task handler.
 *
 * react-native-android-widget calls this file whenever a widget needs
 * to be drawn (on add, update, resize, etc.).  We read the latest data
 * from AsyncStorage (written by the app) and render the appropriate widget.
 *
 * Supported widget names:
 *   budget     – Budget Overview (BudgetWidget)
 *   tasks      – Tasks Today (TasksWidget)
 *   habits     – Habits Today (HabitsWidget)
 *   calendar   – Calendar Agenda (CalendarWidget)
 *   notes      – Notes Overview (NotesWidget)
 *   priorities – Top 5 Priorities (PrioritiesWidget)
 *   gifts      – Gift Tracker (GiftsWidget)
 *   bingo      – 2026 Bingo Goals (BingoWidget)
 */

import React from 'react';
import { registerWidgetTaskHandler, requestWidgetUpdate } from 'react-native-android-widget';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BudgetWidget } from './BudgetWidget';
import { TasksWidget }    from './TasksWidget';
import { HabitsWidget }   from './HabitsWidget';
import { CalendarWidget } from './CalendarWidget';
import { NotesWidget }    from './NotesWidget';
import { PrioritiesWidget } from './PrioritiesWidget';
import { GiftsWidget }    from './GiftsWidget';
import { BingoWidget }    from './BingoWidget';

// ─── Storage keys ─────────────────────────────────────────────────────────────

export const WIDGET_DATA_KEY           = 'budgetWidgetData';
export const TASKS_WIDGET_DATA_KEY     = 'tasksWidgetData';
export const HABITS_WIDGET_DATA_KEY    = 'habitsWidgetData';
export const CALENDAR_WIDGET_DATA_KEY  = 'calendarWidgetData';
export const NOTES_WIDGET_DATA_KEY     = 'notesWidgetData';
export const PRIORITIES_WIDGET_DATA_KEY = 'prioritiesWidgetData';
export const GIFTS_WIDGET_DATA_KEY     = 'giftsWidgetData';
export const BINGO_WIDGET_DATA_KEY     = 'bingoWidgetData';

// ─── Shared data interfaces ───────────────────────────────────────────────────

export interface WidgetData {
  monthLabel: string;
  income: number;
  expenses: number;
  cashflow: number;
}

export interface TaskItemData {
  id: number;
  name: string;
  completed: boolean;
  overdue: boolean;
  priority: 'low' | 'medium' | 'high';
  time?: string;
}

export interface TasksWidgetData {
  tasks: TaskItemData[];
  todayTotal: number;
  todayDone: number;
  overdueCount: number;
  nextTask: string;
}

export interface HabitItemData {
  id: number;
  name: string;
  doneToday: boolean;
  streakDays: number;
  weeklyDone: number;  // completions in the last 7 days
  emoji: string;       // auto-assigned nature emoji
  color: string;       // dot / accent color
}

export interface WeekDayData {
  label: string; // "M", "T", "W", etc.
  pct: number;   // 0-100: habits completed that day / total habits
  isToday: boolean;
}

export interface HabitsWidgetData {
  habits: HabitItemData[];
  doneTodayCount: number;
  totalHabits: number;
  bestStreakName: string;
  bestStreakDays: number;
  weeklyPct: number;
  monthlyPct: number;
  weekDays: WeekDayData[];
}

export interface CalendarEventData {
  name: string;
  time: string;
}

export interface CalendarWidgetData {
  todayLabel: string;
  dayNumber: string;    // e.g. "23"
  dayName: string;      // e.g. "MON"
  monthName: string;    // e.g. "MARCH"
  eventCount: number;
  nextEventName: string;
  nextEventTime: string;
  events: CalendarEventData[];
}

export interface RecentNoteData {
  title: string;
  date: string;
  pinned: boolean;
}

export interface NotesWidgetData {
  totalNotes: number;
  pinnedCount: number;
  latestNoteTitle: string;
  latestNoteDate: string;
  recentNotes: RecentNoteData[];
}

export interface PriorityItemData {
  id: number;
  task: string;
  completed: boolean;
  overdue: boolean;
  subtaskTotal: number;
  subtaskDone: number;
}

export interface PrioritiesWidgetData {
  todayLabel: string;
  completedCount: number;
  totalCount: number;
  nextPriority: string;
  priorities: PriorityItemData[];
}

export interface GiftsWidgetData {
  peopleCount: number;
  totalGifts: number;
  purchasedCount: number;
  nextEventLabel: string;
}

export interface BingoCellData {
  emoji: string;
  text: string;
  done: boolean;
  isFreeSpace: boolean;
}

export interface BingoWidgetData {
  cells: BingoCellData[];
  completedCount: number;
  hasBingo: boolean;
  recentGoal: string;
}

// ─── Save helpers (called from each screen) ───────────────────────────────────

export async function saveWidgetData(data: WidgetData) {
  try { await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export async function saveTasksWidgetData(data: TasksWidgetData) {
  try { await AsyncStorage.setItem(TASKS_WIDGET_DATA_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export async function saveHabitsWidgetData(data: HabitsWidgetData) {
  try { await AsyncStorage.setItem(HABITS_WIDGET_DATA_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export async function saveCalendarWidgetData(data: CalendarWidgetData) {
  try { await AsyncStorage.setItem(CALENDAR_WIDGET_DATA_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export async function saveNotesWidgetData(data: NotesWidgetData) {
  try { await AsyncStorage.setItem(NOTES_WIDGET_DATA_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export async function savePrioritiesWidgetData(data: PrioritiesWidgetData) {
  try { await AsyncStorage.setItem(PRIORITIES_WIDGET_DATA_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export async function saveGiftsWidgetData(data: GiftsWidgetData) {
  try { await AsyncStorage.setItem(GIFTS_WIDGET_DATA_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export async function saveBingoWidgetData(data: BingoWidgetData) {
  try { await AsyncStorage.setItem(BINGO_WIDGET_DATA_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── Update helpers (save to AsyncStorage + push to widget immediately) ───────

export async function updateBudgetWidget(data: WidgetData) {
  await saveWidgetData(data);
  requestWidgetUpdate({ widgetName: 'BudgetWidget', renderWidget: () => React.createElement(BudgetWidget, data), widgetNotFound: () => {} });
}

export async function updateTasksWidget(data: TasksWidgetData) {
  await saveTasksWidgetData(data);
  requestWidgetUpdate({ widgetName: 'TasksWidget', renderWidget: () => React.createElement(TasksWidget, data), widgetNotFound: () => {} });
}

export async function updateHabitsWidget(data: HabitsWidgetData) {
  await saveHabitsWidgetData(data);
  requestWidgetUpdate({ widgetName: 'HabitsWidget', renderWidget: () => React.createElement(HabitsWidget, data), widgetNotFound: () => {} });
}

export async function updateCalendarWidget(data: CalendarWidgetData) {
  await saveCalendarWidgetData(data);
  requestWidgetUpdate({ widgetName: 'CalendarWidget', renderWidget: () => React.createElement(CalendarWidget, data), widgetNotFound: () => {} });
}

export async function updateNotesWidget(data: NotesWidgetData) {
  await saveNotesWidgetData(data);
  requestWidgetUpdate({ widgetName: 'NotesWidget', renderWidget: () => React.createElement(NotesWidget, data), widgetNotFound: () => {} });
}

export async function updatePrioritiesWidget(data: PrioritiesWidgetData) {
  await savePrioritiesWidgetData(data);
  requestWidgetUpdate({ widgetName: 'PrioritiesWidget', renderWidget: () => React.createElement(PrioritiesWidget, data), widgetNotFound: () => {} });
}

export async function updateGiftsWidget(data: GiftsWidgetData) {
  await saveGiftsWidgetData(data);
  requestWidgetUpdate({ widgetName: 'GiftsWidget', renderWidget: () => React.createElement(GiftsWidget, data), widgetNotFound: () => {} });
}

export async function updateBingoWidget(data: BingoWidgetData) {
  await saveBingoWidgetData(data);
  requestWidgetUpdate({ widgetName: 'BingoWidget', renderWidget: () => React.createElement(BingoWidget, data), widgetNotFound: () => {} });
}

// ─── Load helpers ─────────────────────────────────────────────────────────────

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

// ─── Compute widget data directly from app storage ────────────────────────────

async function computeTasksData(): Promise<TasksWidgetData> {
  const tasks: any[] = await load('tasks', []);
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => !t.completed && t.date === today);
  const completedToday = tasks.filter(t => t.completed && t.completedDate === today);
  const overdueTasks = tasks.filter(t => !t.completed && t.date && t.date < today);
  const displayTasks: TaskItemData[] = [
    ...overdueTasks.slice(0, 2).map(t => ({ id: t.id, name: t.name, completed: false, overdue: true, priority: t.priority ?? 'medium', time: t.time || '' })),
    ...todayTasks.slice(0, 4).map(t => ({ id: t.id, name: t.name, completed: false, overdue: false, priority: t.priority ?? 'medium', time: t.time || '' })),
    ...completedToday.slice(0, 2).map(t => ({ id: t.id, name: t.name, completed: true, overdue: false, priority: t.priority ?? 'medium', time: t.time || '' })),
  ].slice(0, 5);
  return { tasks: displayTasks, todayTotal: todayTasks.length, todayDone: completedToday.length, overdueCount: overdueTasks.length, nextTask: todayTasks[0]?.name ?? '' };
}

const HABIT_EMOJIS = ['🌿', '🌸', '🍄', '🌵', '⚡', '🎯', '📚', '💧'];
const HABIT_COLORS = ['#4ade80', '#f472b6', '#34d399', '#fb923c', '#60a5fa', '#a78bfa', '#facc15', '#38bdf8'];

async function computeHabitsData(): Promise<HabitsWidgetData> {
  const habits: any[] = await load('habits', []);
  const completions: any = await load('habitCompletions', {});
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const totalHabits = habits.length;

  let bestStreakName = '', bestStreakDays = 0;
  const habitItems: HabitItemData[] = habits.slice(0, 7).map((h, idx) => {
    const doneToday = !!completions[`${h.id}-${today}`];
    let streak = 0;
    const base = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(base); d.setDate(d.getDate() - i);
      const key = `${h.id}-${d.toISOString().split('T')[0]}`;
      if (completions[key]) { streak++; } else if (i > 0) { break; }
    }
    if (streak > bestStreakDays) { bestStreakDays = streak; bestStreakName = h.name; }
    // Count completions in the last 7 days
    let weeklyDone = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      if (completions[`${h.id}-${d.toISOString().split('T')[0]}`]) weeklyDone++;
    }
    const emoji = HABIT_EMOJIS[idx % HABIT_EMOJIS.length];
    const color = HABIT_COLORS[idx % HABIT_COLORS.length];
    return { id: h.id, name: h.name, doneToday, streakDays: streak, weeklyDone, emoji, color };
  });
  const doneTodayCount = habitItems.filter(h => h.doneToday).length;

  // Weekly heatmap: last 7 days (oldest → today)
  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekDays: WeekDayData[] = [];
  let weeklySum = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayDone = habits.filter(h => !!completions[`${h.id}-${dateStr}`]).length;
    const pct = totalHabits > 0 ? Math.round((dayDone / totalHabits) * 100) : 0;
    weeklySum += pct;
    weekDays.push({ label: DAY_LABELS[d.getDay()], pct, isToday: i === 0 });
  }
  const weeklyPct = Math.round(weeklySum / 7);

  // Monthly progress: completions so far this month / (habits * days elapsed)
  const daysElapsed = now.getDate();
  let monthlyCompletions = 0;
  for (let day = 1; day <= daysElapsed; day++) {
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    const dateStr = d.toISOString().split('T')[0];
    monthlyCompletions += habits.filter(h => !!completions[`${h.id}-${dateStr}`]).length;
  }
  const monthlyPct = totalHabits > 0 && daysElapsed > 0
    ? Math.round((monthlyCompletions / (totalHabits * daysElapsed)) * 100)
    : 0;

  return { habits: habitItems, doneTodayCount, totalHabits, bestStreakName, bestStreakDays, weeklyPct, monthlyPct, weekDays };
}

async function computeCalendarData(): Promise<CalendarWidgetData> {
  const events: any[] = await load('events', []);
  const today = new Date().toISOString().split('T')[0];
  const d = new Date();
  const DAY_NAMES_SHORT = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const MONTH_NAMES = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const todayLabel = `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}, ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getDate()}`;
  const dayNumber = String(d.getDate());
  const dayName = DAY_NAMES_SHORT[d.getDay()];
  const monthName = MONTH_NAMES[d.getMonth()];
  const todayEvents = events.filter((e: any) => e.date === today).sort((a: any, b: any) => (a.time ?? '').localeCompare(b.time ?? ''));
  const next = todayEvents[0];
  const eventItems: CalendarEventData[] = todayEvents.slice(0, 4).map((e: any) => ({ name: e.name ?? '', time: e.time ?? '' }));
  return { todayLabel, dayNumber, dayName, monthName, eventCount: todayEvents.length, nextEventName: next?.name ?? '', nextEventTime: next?.time ?? '', events: eventItems };
}

async function computeNotesData(): Promise<NotesWidgetData> {
  const notes: any[] = await load('notes', []);
  const pinned = notes.filter(n => n.pinned);
  const sorted = [...notes].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const latest = sorted[0];
  const recentNotes: RecentNoteData[] = sorted.slice(0, 4).map(n => ({
    title: n.name ?? n.title ?? 'Untitled',
    date: n.date ?? '',
    pinned: !!n.pinned,
  }));
  return { totalNotes: notes.length, pinnedCount: pinned.length, latestNoteTitle: latest?.name ?? '', latestNoteDate: latest?.date ?? '', recentNotes };
}

async function computePrioritiesData(): Promise<PrioritiesWidgetData> {
  const priorities: any = await load('priorities', {});
  const today = new Date().toISOString().split('T')[0];
  const d = new Date();
  const todayLabel = `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}, ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getDate()}`;

  // Cascade uncompleted priorities from all past dates (same logic as rolloverPriorities)
  const seenIds = new Set<number>();
  const allPastUncompleted: any[] = [];
  const pastDates = Object.keys(priorities).filter(date => date < today).sort().reverse();
  for (const date of pastDates) {
    for (const p of priorities[date] ?? []) {
      if (!p.completed && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        allPastUncompleted.push({ ...p, overdue: true });
      }
    }
  }
  const todayStored: any[] = priorities[today] ?? [];
  const todayNew = todayStored.filter(p => !seenIds.has(p.id));
  const todayList = [...allPastUncompleted, ...todayNew].slice(0, 5);

  const completedCount = todayList.filter(p => p.completed).length;
  const nextPriority = todayList.find(p => !p.completed)?.task ?? '';
  const priorityItems: PriorityItemData[] = todayList.map(p => ({
    id: p.id,
    task: p.task,
    completed: p.completed,
    overdue: p.overdue ?? false,
    subtaskTotal: p.subtasks?.length ?? 0,
    subtaskDone: p.subtasks?.filter((s: any) => s.completed).length ?? 0,
  }));
  return { todayLabel, completedCount, totalCount: todayList.length, nextPriority, priorities: priorityItems };
}

async function computeGiftsData(): Promise<GiftsWidgetData> {
  const giftPeople: any[] = await load('giftPeople', []);
  const allGifts = giftPeople.flatMap(p => p.gifts ?? []);
  const purchasedCount = allGifts.filter((g: any) => g.purchased).length;
  return { peopleCount: giftPeople.length, totalGifts: allGifts.length, purchasedCount, nextEventLabel: '' };
}

async function computeBingoData(): Promise<BingoWidgetData> {
  const bingoData: any[] = await load('bingoData', []);
  const cells: BingoCellData[] = bingoData.map(item => ({
    emoji: item.e ?? '',
    text: item.t ?? '',
    done: item.d ?? false,
    isFreeSpace: item.t === 'FREE SPACE',
  }));
  const completedCount = bingoData.filter(item => item.d).length;
  const recentGoal = [...bingoData].reverse().find(item => item.d && item.t !== 'FREE SPACE')?.t ?? '';
  return { cells, completedCount, hasBingo: false, recentGoal };
}

async function computeBudgetData(): Promise<WidgetData> {
  const transactions: any[] = await load('transactions', []);
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]} ${now.getFullYear()}`;
  const monthTx = transactions.filter(t => (t.date ?? '').startsWith(monthStr));
  const income = monthTx.filter(t => t.type === 'income').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  return { monthLabel, income, expenses, cashflow: income - expenses };
}

// ─── Widget task handler ──────────────────────────────────────────────────────

async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget } = props;
  const widgetName: string = (widgetInfo as any)?.widgetName ?? '';

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      if (widgetName === 'TasksWidget') {
        renderWidget(React.createElement(TasksWidget, await computeTasksData()));

      } else if (widgetName === 'HabitsWidget') {
        renderWidget(React.createElement(HabitsWidget, await computeHabitsData()));

      } else if (widgetName === 'CalendarWidget') {
        renderWidget(React.createElement(CalendarWidget, await computeCalendarData()));

      } else if (widgetName === 'NotesWidget') {
        renderWidget(React.createElement(NotesWidget, await computeNotesData()));

      } else if (widgetName === 'PrioritiesWidget') {
        renderWidget(React.createElement(PrioritiesWidget, await computePrioritiesData()));

      } else if (widgetName === 'GiftsWidget') {
        renderWidget(React.createElement(GiftsWidget, await computeGiftsData()));

      } else if (widgetName === 'BingoWidget') {
        renderWidget(React.createElement(BingoWidget, await computeBingoData()));

      } else if (widgetName === 'BudgetWidget') {
        renderWidget(React.createElement(BudgetWidget, await computeBudgetData()));
      }
      break;
    }
    case 'TOGGLE_TASK': {
      const taskId = parseInt((widgetInfo as any)?.clickData?.taskId ?? '0', 10);
      if (taskId) {
        const today = new Date().toISOString().split('T')[0];
        const tasks: any[] = await load('tasks', []);
        const updated = tasks.map((t: any) =>
          t.id === taskId
            ? { ...t, completed: !t.completed, completedDate: !t.completed ? today : undefined }
            : t
        );
        await AsyncStorage.setItem('tasks', JSON.stringify(updated));
      }
      renderWidget(React.createElement(TasksWidget, await computeTasksData()));
      break;
    }

    case 'TOGGLE_HABIT': {
      const habitId = parseInt((widgetInfo as any)?.clickData?.habitId ?? '0', 10);
      if (habitId) {
        const today = new Date().toISOString().split('T')[0];
        const completions: Record<string, boolean> = await load('habitCompletions', {});
        const key = `${habitId}-${today}`;
        if (completions[key]) {
          delete completions[key];
        } else {
          completions[key] = true;
        }
        await AsyncStorage.setItem('habitCompletions', JSON.stringify(completions));
      }
      renderWidget(React.createElement(HabitsWidget, await computeHabitsData()));
      break;
    }

    case 'TOGGLE_BINGO': {
      const cellIndex = parseInt((widgetInfo as any)?.clickData?.cellIndex ?? '-1', 10);
      if (cellIndex >= 0) {
        const bingoData: any[] = await load('bingoData', []);
        if (bingoData[cellIndex] && bingoData[cellIndex].t !== 'FREE SPACE') {
          bingoData[cellIndex] = { ...bingoData[cellIndex], d: !bingoData[cellIndex].d };
          await AsyncStorage.setItem('bingoData', JSON.stringify(bingoData));
        }
      }
      renderWidget(React.createElement(BingoWidget, await computeBingoData()));
      break;
    }

    case 'TOGGLE_PRIORITY': {
      const priorityId = parseInt((widgetInfo as any)?.clickData?.priorityId ?? '0', 10);
      if (priorityId) {
        const priorities: Record<string, any[]> = await load('priorities', {});
        for (const date of Object.keys(priorities)) {
          const list: any[] = priorities[date] ?? [];
          const idx = list.findIndex((p: any) => p.id === priorityId);
          if (idx >= 0) {
            priorities[date][idx] = { ...priorities[date][idx], completed: !priorities[date][idx].completed };
            break;
          }
        }
        await AsyncStorage.setItem('priorities', JSON.stringify(priorities));
      }
      renderWidget(React.createElement(PrioritiesWidget, await computePrioritiesData()));
      break;
    }

    case 'WIDGET_DELETED':
      break;
    default:
      break;
  }
}

registerWidgetTaskHandler(widgetTaskHandler);
