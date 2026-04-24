/**
 * iOS stub for the Android widget task handler.
 *
 * Android home-screen widgets are not available on iOS. This file exports
 * no-op versions of every function so that app screens can import from
 * '@/widgets/widgetTaskHandler' on both platforms without any changes.
 *
 * Metro bundler automatically resolves .android.ts / .ios.ts suffixes, so
 * on iOS builds this file is used and on Android widgetTaskHandler.android.ts
 * is used instead.
 */

// Storage keys — same values as the Android file so AsyncStorage reads still work
export const WIDGET_DATA_KEY            = 'budgetWidgetData';
export const TASKS_WIDGET_DATA_KEY      = 'tasksWidgetData';
export const HABITS_WIDGET_DATA_KEY     = 'habitsWidgetData';
export const CALENDAR_WIDGET_DATA_KEY   = 'calendarWidgetData';
export const NOTES_WIDGET_DATA_KEY      = 'notesWidgetData';
export const PRIORITIES_WIDGET_DATA_KEY = 'prioritiesWidgetData';
export const GIFTS_WIDGET_DATA_KEY      = 'giftsWidgetData';
export const BINGO_WIDGET_DATA_KEY      = 'bingoWidgetData';
export const BRAIN_DUMP_WIDGET_DATA_KEY = 'brainDumpWidgetData';
export const LOCK_SCREEN_PRIORITIES_WIDGET_DATA_KEY = 'lockScreenPrioritiesWidgetData';

// No-op save helpers
export async function saveWidgetData()         {}
export async function saveTasksWidgetData()    {}
export async function saveHabitsWidgetData()   {}
export async function saveCalendarWidgetData() {}
export async function saveNotesWidgetData()    {}
export async function savePrioritiesWidgetData() {}
export async function saveGiftsWidgetData()    {}
export async function saveBingoWidgetData()    {}
export async function saveBrainDumpWidgetData() {}
export async function saveLockScreenPrioritiesWidgetData() {}

// No-op update helpers
export async function updateBudgetWidget()     {}
export async function updateTasksWidget()      {}
export async function updateHabitsWidget()     {}
export async function updateCalendarWidget()   {}
export async function updateNotesWidget()      {}
export async function updatePrioritiesWidget() {}
export async function updateGiftsWidget()      {}
export async function updateBingoWidget()      {}
export async function updateBrainDumpWidget()  {}
export async function updateLockScreenPrioritiesWidget() {}
