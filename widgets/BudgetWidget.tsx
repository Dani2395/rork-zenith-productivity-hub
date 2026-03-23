"use no memo";
/**
 * Android home-screen widget — Budget (finance terminal aesthetic)
 *
 * Shows monthly income, expenses, and net cashflow with a ratio bar.
 * Tapping opens the Budget screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface BudgetWidgetProps {
  monthLabel: string;
  income: number;
  expenses: number;
  cashflow: number;
}

export function BudgetWidget({ monthLabel, income, expenses, cashflow }: BudgetWidgetProps) {
  const cashflowPositive = cashflow >= 0;
  const cashflowColor = cashflowPositive ? '#4ade80' : '#f87171';
  const cashflowSign = cashflowPositive ? '+' : '-';

  // Ratio bar: income vs expense as proportional flex units
  const total = income + expenses;
  const incFlex = Math.max(1, total > 0 ? Math.round((income / total) * 100) : 50);
  const expFlex = Math.max(1, 100 - incFlex);

  // Savings rate
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const savingsColor = savingsRate >= 20 ? '#4ade80' : savingsRate >= 0 ? '#facc15' : '#f87171';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#080d14',
        borderRadius: 20,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: 'rork-app:///budget' }}
    >
      {/* ── Header ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          width: 'match_parent',
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <TextWidget
          text="m o n t h l y   o v e r v i e w"
          style={{ fontSize: 9, color: '#60a5fa', fontWeight: 'bold' }}
        />
        <TextWidget
          text="BUDGET"
          style={{ fontSize: 22, color: '#ffffff', fontWeight: 'bold', marginTop: 2 }}
        />
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#0e1e30', marginBottom: 6 }} />

      {/* ── Income / Expenses side by side ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        {/* Income card */}
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: 'column',
            backgroundColor: '#0a1f14',
            borderRadius: 10,
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            paddingRight: 10,
            marginRight: 6,
            borderWidth: 1,
            borderColor: '#166534',
          }}
        >
          <TextWidget text="INCOME" style={{ fontSize: 8, color: '#4a7a5a', fontWeight: 'bold' }} />
          <TextWidget
            text={`+$${income.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            style={{ fontSize: 14, color: '#4ade80', fontWeight: 'bold', marginTop: 4 }}
          />
        </FlexWidget>

        {/* Expenses card */}
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: 'column',
            backgroundColor: '#1f0a0a',
            borderRadius: 10,
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            paddingRight: 10,
            marginLeft: 6,
            borderWidth: 1,
            borderColor: '#7f1d1d',
          }}
        >
          <TextWidget text="EXPENSES" style={{ fontSize: 8, color: '#7a4a4a', fontWeight: 'bold' }} />
          <TextWidget
            text={`-$${expenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            style={{ fontSize: 14, color: '#f87171', fontWeight: 'bold', marginTop: 4 }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── Net cashflow ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 10,
          paddingBottom: 6,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text="NET CASHFLOW" style={{ fontSize: 9, color: '#2d4a6a', fontWeight: 'bold' }} />
          <TextWidget
            text={`${cashflowSign}$${Math.abs(cashflow).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            style={{ fontSize: 20, color: cashflowColor, fontWeight: 'bold', marginTop: 2 }}
          />
        </FlexWidget>
        <FlexWidget
          style={{
            backgroundColor: savingsRate >= 0 ? '#0a1f14' : '#1f0a0a',
            borderRadius: 10,
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: 8,
            paddingRight: 8,
            borderWidth: 1,
            borderColor: savingsColor,
          }}
        >
          <TextWidget text="SAVED" style={{ fontSize: 8, color: '#4a5e6a', fontWeight: 'bold' }} />
          <TextWidget
            text={`${savingsRate}%`}
            style={{ fontSize: 13, color: savingsColor, fontWeight: 'bold', marginTop: 2 }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── Ratio bar ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          paddingLeft: 14,
          paddingRight: 14,
          paddingBottom: 4,
        }}
      >
        <FlexWidget style={{ flex: 1, height: 4, borderRadius: 2, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#0e1e30' }}>
          <FlexWidget style={{ flex: incFlex, height: 4, backgroundColor: '#166534' }} />
          <FlexWidget style={{ flex: expFlex, height: 4, backgroundColor: '#7f1d1d' }} />
        </FlexWidget>
      </FlexWidget>

      {/* ── Footer ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#0e1e30', marginTop: 4 }} />
      <FlexWidget
        style={{
          width: 'match_parent',
          paddingTop: 7,
          paddingBottom: 9,
          paddingLeft: 14,
          paddingRight: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text={monthLabel.toUpperCase()}
          style={{ fontSize: 9, color: '#2d4a6a', fontWeight: 'bold' }}
        />
        <TextWidget
          text={`${income > 0 ? Math.round((expenses / income) * 100) : 0}% spent`}
          style={{ fontSize: 9, color: '#2d4a6a' }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
