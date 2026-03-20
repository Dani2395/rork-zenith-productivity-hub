"use no memo";
/**
 * Android home-screen widget — 2026 Bingo Goals
 *
 * Shows completed squares out of 25 and whether a bingo line has been achieved.
 * Tapping the widget opens the app's Bingo screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface BingoWidgetProps {
  completedCount: number;   // out of 25
  hasBingo: boolean;
  recentGoal: string;       // last completed goal text
}

export function BingoWidget({ completedCount, hasBingo, recentGoal }: BingoWidgetProps) {
  const pct = Math.round((completedCount / 25) * 100);
  const pctColor = hasBingo ? '#4ade80' : completedCount >= 13 ? '#facc15' : '#818cf8';

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
        <TextWidget text="🎯" style={{ fontSize: 14 }} />
        <TextWidget
          text=" 2026 Bingo"
          style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <TextWidget text="Goals done" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${completedCount} / 25`}
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

      {hasBingo && (
        <TextWidget
          text="🎉 BINGO achieved!"
          style={{ fontSize: 12, color: '#4ade80', fontWeight: 'bold', marginBottom: 4 }}
        />
      )}

      {recentGoal ? (
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text="Latest" style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }} />
          <TextWidget
            text={recentGoal}
            style={{ fontSize: 10, color: '#cbd5e1' }}
          />
        </FlexWidget>
      ) : (
        <TextWidget
          text="Start checking off goals!"
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
