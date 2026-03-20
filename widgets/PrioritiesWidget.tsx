"use no memo";
/**
 * Android home-screen widget — Top 5 Priorities
 *
 * Shows today's priority completion status and the first pending priority.
 * Tapping the widget opens the app's Home screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface PrioritiesWidgetProps {
  todayLabel: string;
  completedCount: number;
  totalCount: number;
  nextPriority: string;
}

export function PrioritiesWidget({
  todayLabel,
  completedCount,
  totalCount,
  nextPriority,
}: PrioritiesWidgetProps) {
  const allDone = totalCount > 0 && completedCount >= totalCount;
  const pctColor = allDone ? '#4ade80' : completedCount > 0 ? '#facc15' : '#94a3b8';

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
        <TextWidget text="⭐" style={{ fontSize: 14 }} />
        <TextWidget
          text=" Top Priorities"
          style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' }}
        />
      </FlexWidget>

      <TextWidget
        text={todayLabel}
        style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}
      />

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <TextWidget text="Done" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${completedCount} / ${totalCount}`}
          style={{ fontSize: 11, color: pctColor, fontWeight: 'bold' }}
        />
      </FlexWidget>

      <FlexWidget style={{ height: 1, backgroundColor: '#1e293b', marginTop: 6, marginBottom: 6 }} />

      {allDone ? (
        <TextWidget
          text="All priorities done! 🎉"
          style={{ fontSize: 11, color: '#4ade80', fontWeight: 'bold' }}
        />
      ) : nextPriority ? (
        <>
          <TextWidget
            text="Next up"
            style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}
          />
          <TextWidget
            text={nextPriority}
            style={{ fontSize: 11, color: '#cbd5e1' }}
          />
        </>
      ) : (
        <TextWidget
          text="Add your priorities for today"
          style={{ fontSize: 10, color: '#475569', fontStyle: 'italic' }}
        />
      )}

      <TextWidget
        text="Tap to open Zenith"
        style={{ fontSize: 9, color: '#475569', marginTop: 6, textAlign: 'right' }}
      />
    </FlexWidget>
  );
}
