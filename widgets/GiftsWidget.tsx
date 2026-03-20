"use no memo";
/**
 * Android home-screen widget — Gifts Overview
 *
 * Shows number of people tracked, total gift ideas, and how many are purchased.
 * Tapping the widget opens the app's Gifts screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface GiftsWidgetProps {
  peopleCount: number;
  totalGifts: number;
  purchasedCount: number;
  nextEventLabel: string; // e.g. "Mom — Birthday in 5 days"
}

export function GiftsWidget({
  peopleCount,
  totalGifts,
  purchasedCount,
  nextEventLabel,
}: GiftsWidgetProps) {
  const remaining = totalGifts - purchasedCount;

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
        <TextWidget text="🎁" style={{ fontSize: 14 }} />
        <TextWidget
          text=" Gift Tracker"
          style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <TextWidget text="People" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${peopleCount}`}
          style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 'bold' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
        <TextWidget text="Purchased" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${purchasedCount} / ${totalGifts}`}
          style={{ fontSize: 11, color: '#4ade80', fontWeight: 'bold' }}
        />
      </FlexWidget>

      {remaining > 0 && (
        <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
          <TextWidget text="Still needed" style={{ fontSize: 11, color: '#94a3b8' }} />
          <TextWidget
            text={`${remaining}`}
            style={{ fontSize: 11, color: '#f87171', fontWeight: 'bold' }}
          />
        </FlexWidget>
      )}

      <FlexWidget style={{ height: 1, backgroundColor: '#1e293b', marginTop: 6, marginBottom: 6 }} />

      <TextWidget
        text={nextEventLabel || 'No upcoming gift events'}
        style={{ fontSize: 10, color: nextEventLabel ? '#cbd5e1' : '#475569', fontStyle: nextEventLabel ? 'normal' : 'italic' }}
      />

      <TextWidget
        text="Tap to open Zenith"
        style={{ fontSize: 9, color: '#475569', marginTop: 4, textAlign: 'right' }}
      />
    </FlexWidget>
  );
}
