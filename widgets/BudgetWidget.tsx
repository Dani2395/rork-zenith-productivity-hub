/**
 * Android home-screen widget — Budget Overview
 *
 * Shows the current month's income, expenses, and net cashflow.
 * Tapping the widget opens the app's Budget screen.
 *
 * This file is used by react-native-android-widget's task handler
 * to render the widget view into a RemoteViews-compatible format.
 */

import React from 'react';
import {
  FlexWidget,
  TextWidget,
  ImageWidget,
} from 'react-native-android-widget';

export interface BudgetWidgetProps {
  monthLabel: string;
  income: number;
  expenses: number;
  cashflow: number;
}

export function BudgetWidget({
  monthLabel,
  income,
  expenses,
  cashflow,
}: BudgetWidgetProps) {
  const cashflowPositive = cashflow >= 0;
  const cashflowColor = cashflowPositive ? '#4ade80' : '#f87171';
  const cashflowSign = cashflowPositive ? '+' : '';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 12,
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* Header */}
      <FlexWidget
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
      >
        <TextWidget
          text="📊"
          style={{ fontSize: 14 }}
        />
        <TextWidget
          text={` ${monthLabel}`}
          style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' }}
        />
      </FlexWidget>

      {/* Income row */}
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}
      >
        <TextWidget
          text="Income"
          style={{ fontSize: 11, color: '#94a3b8' }}
        />
        <TextWidget
          text={`+$${income.toFixed(0)}`}
          style={{ fontSize: 11, color: '#4ade80', fontWeight: 'bold' }}
        />
      </FlexWidget>

      {/* Expenses row */}
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}
      >
        <TextWidget
          text="Expenses"
          style={{ fontSize: 11, color: '#94a3b8' }}
        />
        <TextWidget
          text={`-$${expenses.toFixed(0)}`}
          style={{ fontSize: 11, color: '#f87171', fontWeight: 'bold' }}
        />
      </FlexWidget>

      {/* Divider */}
      <FlexWidget
        style={{ height: 1, backgroundColor: '#1e293b', marginTop: 6, marginBottom: 6 }}
      />

      {/* Net cashflow */}
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <TextWidget
          text="Net Cashflow"
          style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 'bold' }}
        />
        <TextWidget
          text={`${cashflowSign}$${Math.abs(cashflow).toFixed(0)}`}
          style={{ fontSize: 14, color: cashflowColor, fontWeight: 'bold' }}
        />
      </FlexWidget>

      {/* Tap hint */}
      <TextWidget
        text="Tap to open Zenith"
        style={{ fontSize: 9, color: '#475569', marginTop: 6, textAlign: 'right' }}
      />
    </FlexWidget>
  );
}
