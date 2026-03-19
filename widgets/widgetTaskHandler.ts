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

// ─── Widget task handler ──────────────────────────────────────────────────────

async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget } = props;
  const widgetName: string = (widgetInfo as any)?.widgetName ?? '';

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      if (widgetName === 'TasksWidget') {
        const data = await load<TasksWidgetData>(TASKS_WIDGET_DATA_KEY, {
          todayTotal: 0, todayDone: 0, overdueCount: 0, nextTask: '',
        });
        renderWidget(React.createElement(TasksWidget, data));

      } else if (widgetName === 'HabitsWidget') {
        const data = await load<HabitsWidgetData>(HABITS_WIDGET_DATA_KEY, {
          doneTodayCount: 0, totalHabits: 0, bestStreakName: '', bestStreakDays: 0,
        });
        renderWidget(React.createElement(HabitsWidget, data));

      } else if (widgetName === 'CalendarWidget') {
        const data = await load<CalendarWidgetData>(CALENDAR_WIDGET_DATA_KEY, {
          todayLabel: 'Today', eventCount: 0, nextEventName: '', nextEventTime: '',
        });
        renderWidget(React.createElement(CalendarWidget, data));

      } else if (widgetName === 'NotesWidget') {
        const data = await load<NotesWidgetData>(NOTES_WIDGET_DATA_KEY, {
          totalNotes: 0, pinnedCount: 0, latestNoteTitle: '', latestNoteDate: '',
        });
        renderWidget(React.createElement(NotesWidget, data));

      } else if (widgetName === 'PrioritiesWidget') {
        const data = await load<PrioritiesWidgetData>(PRIORITIES_WIDGET_DATA_KEY, {
          todayLabel: 'Today', completedCount: 0, totalCount: 0, nextPriority: '',
        });
        renderWidget(React.createElement(PrioritiesWidget, data));

      } else if (widgetName === 'GiftsWidget') {
        const data = await load<GiftsWidgetData>(GIFTS_WIDGET_DATA_KEY, {
          peopleCount: 0, totalGifts: 0, purchasedCount: 0, nextEventLabel: '',
        });
        renderWidget(React.createElement(GiftsWidget, data));

      } else if (widgetName === 'BingoWidget') {
        const data = await load<BingoWidgetData>(BINGO_WIDGET_DATA_KEY, {
          completedCount: 0, hasBingo: false, recentGoal: '',
        });
        renderWidget(React.createElement(BingoWidget, data));

      } else if (widgetName === 'BudgetWidget') {
        const data = await load<WidgetData>(WIDGET_DATA_KEY, {
          monthLabel: 'This Month', income: 0, expenses: 0, cashflow: 0,
        });
        renderWidget(React.createElement(BudgetWidget, data));
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
