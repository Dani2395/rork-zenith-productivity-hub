/**
 * Android home-screen widget — Habits Overview
 *
 * Shows today's habit completion count and a brief streak summary.
 * Tapping the widget opens the app's Habits screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface HabitsWidgetProps {
  doneTodayCount: number;
  totalHabits: number;
  bestStreakName: string;
  bestStreakDays: number;
}

export function HabitsWidget({
  doneTodayCount,
  totalHabits,
  bestStreakName,
  bestStreakDays,
}: HabitsWidgetProps) {
  const pct = totalHabits > 0 ? Math.round((doneTodayCount / totalHabits) * 100) : 0;
  const pctColor = pct === 100 ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171';

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
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <TextWidget text="🔥" style={{ fontSize: 14 }} />
        <TextWidget
          text=" Habits Today"
          style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <TextWidget text="Completed" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${doneTodayCount} / ${totalHabits}`}
          style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 'bold' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
        <TextWidget text="Progress" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${pct}%`}
          style={{ fontSize: 11, color: pctColor, fontWeight: 'bold' }}
        />
      </FlexWidget>

      <FlexWidget style={{ height: 1, backgroundColor: '#1e293b', marginTop: 6, marginBottom: 6 }} />

      {bestStreakName ? (
        <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TextWidget
            text={bestStreakName}
            style={{ fontSize: 10, color: '#cbd5e1' }}
          />
          <TextWidget
            text={`${bestStreakDays}d 🔥`}
            style={{ fontSize: 10, color: '#fb923c', fontWeight: 'bold' }}
          />
        </FlexWidget>
      ) : (
        <TextWidget
          text="Add your first habit!"
          style={{ fontSize: 10, color: '#475569', fontStyle: 'italic' }}
        />
      )}

      <TextWidget
        text="Tap to open Zenith"
        style={{ fontSize: 9, color: '#475569', marginTop: 4, textAlign: 'right' }}
      />
    </FlexWidget>
  );
}
