/**
 * Android widget task handler.
 *
 * react-native-android-widget calls this file whenever the widget needs
 * to be drawn (on add, update, resize, etc.).  We read the latest budget
 * figures from AsyncStorage (written by the app) and render BudgetWidget.
 */

import React from 'react';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BudgetWidget } from './BudgetWidget';

export const WIDGET_DATA_KEY = 'budgetWidgetData';

export interface WidgetData {
  monthLabel: string;
  income: number;
  expenses: number;
  cashflow: number;
}

/** Save current month data so the widget task handler can read it. */
export async function saveWidgetData(data: WidgetData) {
  try {
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

async function loadWidgetData(): Promise<WidgetData> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { monthLabel: 'This Month', income: 0, expenses: 0, cashflow: 0 };
}

async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await loadWidgetData();
      props.renderWidget(
        React.createElement(BudgetWidget, {
          monthLabel: data.monthLabel,
          income: data.income,
          expenses: data.expenses,
          cashflow: data.cashflow,
        })
      );
      break;
    }
    case 'WIDGET_DELETED':
      break;
    default:
      break;
  }
}

registerWidgetTaskHandler(widgetTaskHandler);
