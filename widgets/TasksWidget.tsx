/**
 * Android home-screen widget — Tasks Overview
 *
 * Shows today's pending task count, overdue count, and the next task name.
 * Tapping the widget opens the app's Tasks screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface TasksWidgetProps {
  todayTotal: number;
  todayDone: number;
  overdueCount: number;
  nextTask: string;
}

export function TasksWidget({ todayTotal, todayDone, overdueCount, nextTask }: TasksWidgetProps) {
  const remaining = todayTotal - todayDone;

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
        <TextWidget text="✅" style={{ fontSize: 14 }} />
        <TextWidget
          text=" Tasks Today"
          style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <TextWidget text="Done" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${todayDone} / ${todayTotal}`}
          style={{ fontSize: 11, color: '#4ade80', fontWeight: 'bold' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
        <TextWidget text="Remaining" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${remaining}`}
          style={{ fontSize: 11, color: remaining > 0 ? '#facc15' : '#4ade80', fontWeight: 'bold' }}
        />
      </FlexWidget>

      {overdueCount > 0 && (
        <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
          <TextWidget text="Overdue" style={{ fontSize: 11, color: '#94a3b8' }} />
          <TextWidget
            text={`${overdueCount}`}
            style={{ fontSize: 11, color: '#f87171', fontWeight: 'bold' }}
          />
        </FlexWidget>
      )}

      <FlexWidget style={{ height: 1, backgroundColor: '#1e293b', marginTop: 6, marginBottom: 6 }} />

      <TextWidget
        text={nextTask || 'All done! 🎉'}
        style={{ fontSize: 10, color: '#cbd5e1', fontStyle: 'italic' }}
      />

      <TextWidget
        text="Tap to open Zenith"
        style={{ fontSize: 9, color: '#475569', marginTop: 4, textAlign: 'right' }}
      />
    </FlexWidget>
  );
}
