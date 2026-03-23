"use no memo";
/**
 * Android home-screen widget — Gifts (vault aesthetic)
 *
 * Shows gift purchase progress, people count, and remaining gifts.
 * Tapping opens the Gifts screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface GiftsWidgetProps {
  peopleCount: number;
  totalGifts: number;
  purchasedCount: number;
  nextEventLabel: string;
}

export function GiftsWidget({ peopleCount, totalGifts, purchasedCount, nextEventLabel }: GiftsWidgetProps) {
  const remaining = totalGifts - purchasedCount;
  const pct = totalGifts > 0 ? Math.round((purchasedCount / totalGifts) * 100) : 0;
  const barFilled = Math.max(1, pct);
  const barEmpty = Math.max(1, 100 - pct);
  const allDone = totalGifts > 0 && remaining === 0;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#0f0810',
        borderRadius: 20,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: 'rork-app:///gifts' }}
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
          text="g i f t   v a u l t"
          style={{ fontSize: 9, color: '#c084fc', fontWeight: 'bold' }}
        />
        <TextWidget
          text="GIFTS"
          style={{ fontSize: 22, color: '#ffffff', fontWeight: 'bold', marginTop: 2 }}
        />
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1e1028' }} />

      {/* ── Stats grid ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 14,
          paddingBottom: 10,
        }}
      >
        {/* People */}
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#1a0f22',
            borderRadius: 10,
            paddingTop: 10,
            paddingBottom: 10,
            marginRight: 6,
            borderWidth: 1,
            borderColor: '#2e1f40',
          }}
        >
          <TextWidget text={String(peopleCount)} style={{ fontSize: 22, color: '#c084fc', fontWeight: 'bold' }} />
          <TextWidget text="PEOPLE" style={{ fontSize: 8, color: '#4a3860', fontWeight: 'bold', marginTop: 2 }} />
        </FlexWidget>

        {/* Purchased */}
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: allDone ? '#0a1f14' : '#1a0f22',
            borderRadius: 10,
            paddingTop: 10,
            paddingBottom: 10,
            marginRight: 6,
            borderWidth: 1,
            borderColor: allDone ? '#166534' : '#2e1f40',
          }}
        >
          <TextWidget
            text={`${purchasedCount}/${totalGifts}`}
            style={{ fontSize: 18, color: allDone ? '#4ade80' : '#c084fc', fontWeight: 'bold' }}
          />
          <TextWidget text="BOUGHT" style={{ fontSize: 8, color: '#4a3860', fontWeight: 'bold', marginTop: 2 }} />
        </FlexWidget>

        {/* Remaining */}
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: remaining > 0 ? '#1f0a14' : '#0a1f14',
            borderRadius: 10,
            paddingTop: 10,
            paddingBottom: 10,
            borderWidth: 1,
            borderColor: remaining > 0 ? '#4a1030' : '#166534',
          }}
        >
          <TextWidget
            text={String(remaining)}
            style={{ fontSize: 22, color: remaining > 0 ? '#f472b6' : '#4ade80', fontWeight: 'bold' }}
          />
          <TextWidget text="LEFT" style={{ fontSize: 8, color: '#4a3860', fontWeight: 'bold', marginTop: 2 }} />
        </FlexWidget>
      </FlexWidget>

      {/* ── Progress bar ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          paddingLeft: 14,
          paddingRight: 14,
          paddingBottom: 4,
          alignItems: 'center',
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            flexDirection: 'row',
            backgroundColor: '#1e1028',
            overflow: 'hidden',
          }}
        >
          <FlexWidget style={{ flex: barFilled, height: 6, borderRadius: 3, backgroundColor: allDone ? '#4ade80' : '#a855f7' }} />
          <FlexWidget style={{ flex: barEmpty, height: 6 }} />
        </FlexWidget>
        <TextWidget
          text={`  ${pct}%`}
          style={{ fontSize: 10, color: allDone ? '#4ade80' : '#a855f7', fontWeight: 'bold' }}
        />
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1e1028', marginTop: 6 }} />

      {/* ── Footer: next event ── */}
      <FlexWidget
        style={{
          width: 'match_parent',
          paddingTop: 8,
          paddingBottom: 10,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        <TextWidget
          text={nextEventLabel ? nextEventLabel.toUpperCase() : allDone ? '✓ ALL GIFTS SORTED' : 'NO UPCOMING EVENTS'}
          style={{
            fontSize: 9,
            color: nextEventLabel ? '#7c3aed' : allDone ? '#4ade80' : '#2e1f40',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
