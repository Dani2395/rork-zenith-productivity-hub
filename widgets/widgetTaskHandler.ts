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

export interface TasksWidgetData {
  todayTotal: number;
  todayDone: number;
  overdueCount: number;
  nextTask: string;
}

export interface HabitsWidgetData {
  doneTodayCount: number;
  totalHabits: number;
  bestStreakName: string;
  bestStreakDays: number;
}

export interface CalendarWidgetData {
  todayLabel: string;
  eventCount: number;
  nextEventName: string;
  nextEventTime: string;
}

export interface NotesWidgetData {
  totalNotes: number;
  pinnedCount: number;
  latestNoteTitle: string;
  latestNoteDate: string;
}

export interface PrioritiesWidgetData {
  todayLabel: string;
  completedCount: number;
  totalCount: number;
  nextPriority: string;
}

export interface GiftsWidgetData {
  peopleCount: number;
  totalGifts: number;
  purchasedCount: number;
  nextEventLabel: string;
}

export interface BingoWidgetData {
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
  requestWidgetUpdate({ widgetName: 'BudgetWidget', renderWidget: async () => React.createElement(BudgetWidget, data), widgetNotFound: () => {} });
}

export async function updateTasksWidget(data: TasksWidgetData) {
  await saveTasksWidgetData(data);
  requestWidgetUpdate({ widgetName: 'TasksWidget', renderWidget: async () => React.createElement(TasksWidget, data), widgetNotFound: () => {} });
}

export async function updateHabitsWidget(data: HabitsWidgetData) {
  await saveHabitsWidgetData(data);
  requestWidgetUpdate({ widgetName: 'HabitsWidget', renderWidget: async () => React.createElement(HabitsWidget, data), widgetNotFound: () => {} });
}

export async function updateCalendarWidget(data: CalendarWidgetData) {
  await saveCalendarWidgetData(data);
  requestWidgetUpdate({ widgetName: 'CalendarWidget', renderWidget: async () => React.createElement(CalendarWidget, data), widgetNotFound: () => {} });
}

export async function updateNotesWidget(data: NotesWidgetData) {
  await saveNotesWidgetData(data);
  requestWidgetUpdate({ widgetName: 'NotesWidget', renderWidget: async () => React.createElement(NotesWidget, data), widgetNotFound: () => {} });
}

export async function updatePrioritiesWidget(data: PrioritiesWidgetData) {
  await savePrioritiesWidgetData(data);
  requestWidgetUpdate({ widgetName: 'PrioritiesWidget', renderWidget: async () => React.createElement(PrioritiesWidget, data), widgetNotFound: () => {} });
}

export async function updateGiftsWidget(data: GiftsWidgetData) {
  await saveGiftsWidgetData(data);
  requestWidgetUpdate({ widgetName: 'GiftsWidget', renderWidget: async () => React.createElement(GiftsWidget, data), widgetNotFound: () => {} });
}

export async function updateBingoWidget(data: BingoWidgetData) {
  await saveBingoWidgetData(data);
  requestWidgetUpdate({ widgetName: 'BingoWidget', renderWidget: async () => React.createElement(BingoWidget, data), widgetNotFound: () => {} });
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
  return { todayTotal: todayTasks.length, todayDone: completedToday.length, overdueCount: overdueTasks.length, nextTask: todayTasks[0]?.name ?? '' };
}

async function computeHabitsData(): Promise<HabitsWidgetData> {
  const habits: any[] = await load('habits', []);
  const completions: any = await load('habitCompletions', {});
  const today = new Date().toISOString().split('T')[0];
  const doneTodayCount = habits.filter(h => completions[`${h.id}-${today}`]).length;
  let bestStreakName = '', bestStreakDays = 0;
  for (const habit of habits) {
    let streak = 0;
    const base = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(base); d.setDate(d.getDate() - i);
      const key = `${habit.id}-${d.toISOString().split('T')[0]}`;
      if (completions[key]) { streak++; } else if (i > 0) { break; }
    }
    if (streak > bestStreakDays) { bestStreakDays = streak; bestStreakName = habit.name; }
  }
  return { doneTodayCount, totalHabits: habits.length, bestStreakName, bestStreakDays };
}

async function computeCalendarData(): Promise<CalendarWidgetData> {
  const events: any[] = await load('events', []);
  const today = new Date().toISOString().split('T')[0];
  const d = new Date();
  const todayLabel = `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}, ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getDate()}`;
  const todayEvents = events.filter((e: any) => e.date === today).sort((a: any, b: any) => (a.time ?? '').localeCompare(b.time ?? ''));
  const next = todayEvents[0];
  return { todayLabel, eventCount: todayEvents.length, nextEventName: next?.name ?? '', nextEventTime: next?.time ?? '' };
}

async function computeNotesData(): Promise<NotesWidgetData> {
  const notes: any[] = await load('notes', []);
  const pinned = notes.filter(n => n.pinned);
  const latest = [...notes].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0];
  return { totalNotes: notes.length, pinnedCount: pinned.length, latestNoteTitle: latest?.name ?? '', latestNoteDate: latest?.date ?? '' };
}

async function computePrioritiesData(): Promise<PrioritiesWidgetData> {
  const priorities: any = await load('priorities', {});
  const today = new Date().toISOString().split('T')[0];
  const d = new Date();
  const todayLabel = `${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]}, ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getDate()}`;
  const todayList: any[] = priorities[today] ?? [];
  const completedCount = todayList.filter(p => p.completed).length;
  const nextPriority = todayList.find(p => !p.completed)?.task ?? '';
  return { todayLabel, completedCount, totalCount: todayList.length, nextPriority };
}

async function computeGiftsData(): Promise<GiftsWidgetData> {
  const giftPeople: any[] = await load('giftPeople', []);
  const allGifts = giftPeople.flatMap(p => p.gifts ?? []);
  const purchasedCount = allGifts.filter((g: any) => g.purchased).length;
  return { peopleCount: giftPeople.length, totalGifts: allGifts.length, purchasedCount, nextEventLabel: '' };
}

async function computeBingoData(): Promise<BingoWidgetData> {
  const bingoData: any[] = await load('bingoData', []);
  const completedCount = bingoData.filter(item => item.d).length;
  const recentGoal = [...bingoData].reverse().find(item => item.d && item.t !== 'FREE SPACE')?.t ?? '';
  return { completedCount, hasBingo: false, recentGoal };
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
    case 'WIDGET_DELETED':
      break;
    default:
      break;
  }
}

registerWidgetTaskHandler(widgetTaskHandler);
