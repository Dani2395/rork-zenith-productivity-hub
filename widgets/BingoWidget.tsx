"use no memo";
/**
 * Android home-screen widget — 2026 Bingo Goals (full 5×5 card)
 *
 * Renders the complete bingo grid. Done cells are green, free space is
 * gold, pending cells are dark. Each row is tappable to open the app.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface BingoCellData {
  emoji: string;
  text: string;
  done: boolean;
  isFreeSpace: boolean;
}

export interface BingoWidgetProps {
  cells: BingoCellData[];
  completedCount: number;
  hasBingo: boolean;
  recentGoal: string;
}

const BINGO_URI = 'rork-app:///bingo';

function BingoCell({ cell }: { cell: BingoCellData }) {
  "use no memo";
  if (!cell) return null;
  const bg = cell.isFreeSpace ? '#713f12' : cell.done ? '#14532d' : '#1e293b';
  const emojiColor = cell.done || cell.isFreeSpace ? '#ffffff' : '#64748b';
  const textColor = cell.isFreeSpace ? '#fef08a' : cell.done ? '#86efac' : '#475569';
  const label = cell.isFreeSpace ? 'FREE' : cell.text.length > 6 ? cell.text.slice(0, 6) : cell.text;

  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        borderRadius: 6,
        margin: 2,
        paddingTop: 4,
        paddingBottom: 4,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: BINGO_URI }}
    >
      <TextWidget
        text={cell.isFreeSpace ? '⭐' : (cell.done ? cell.emoji : cell.emoji)}
        style={{ fontSize: 13, textAlign: 'center', color: emojiColor }}
      />
      <TextWidget
        text={label}
        style={{ fontSize: 7, color: textColor, textAlign: 'center', marginTop: 1 }}
      />
      {cell.done && !cell.isFreeSpace ? (
        <TextWidget text="✓" style={{ fontSize: 8, color: '#4ade80', fontWeight: 'bold' }} />
      ) : null}
    </FlexWidget>
  );
}

function BingoRow({ c0, c1, c2, c3, c4 }: { c0: BingoCellData; c1: BingoCellData; c2: BingoCellData; c3: BingoCellData; c4: BingoCellData }) {
  "use no memo";
  return (
    <FlexWidget style={{ flexDirection: 'row', flex: 1, width: 'match_parent', paddingLeft: 4, paddingRight: 4 }}>
      <BingoCell cell={c0} />
      <BingoCell cell={c1} />
      <BingoCell cell={c2} />
      <BingoCell cell={c3} />
      <BingoCell cell={c4} />
    </FlexWidget>
  );
}

const EMPTY_CELL: BingoCellData = { emoji: '', text: '', done: false, isFreeSpace: false };

export function BingoWidget({ cells = [], completedCount, hasBingo, recentGoal }: BingoWidgetProps) {
  const pct = Math.round((completedCount / 25) * 100);
  const c = (i: number): BingoCellData => cells[i] ?? EMPTY_CELL;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#111827',
        borderRadius: 20,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: BINGO_URI }}
    >
      {/* ── Header ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          backgroundColor: '#1a1a2e',
          borderRadius: 20,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text="🎯" style={{ fontSize: 15 }} />
          <TextWidget
            text="  2026 Bingo"
            style={{ fontSize: 15, fontWeight: 'bold', color: '#f1f5f9' }}
          />
          {hasBingo ? (
            <TextWidget text="  🎉" style={{ fontSize: 13 }} />
          ) : null}
        </FlexWidget>
        <FlexWidget
          style={{
            backgroundColor: hasBingo ? '#14532d' : '#312e81',
            borderRadius: 10,
            paddingTop: 3,
            paddingBottom: 3,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          <TextWidget
            text={`${completedCount}/25  ${pct}%`}
            style={{ fontSize: 11, color: '#c4b5fd', fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── 5×5 Grid ── */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          width: 'match_parent',
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        <BingoRow c0={c(0)}  c1={c(1)}  c2={c(2)}  c3={c(3)}  c4={c(4)}  />
        <BingoRow c0={c(5)}  c1={c(6)}  c2={c(7)}  c3={c(8)}  c4={c(9)}  />
        <BingoRow c0={c(10)} c1={c(11)} c2={c(12)} c3={c(13)} c4={c(14)} />
        <BingoRow c0={c(15)} c1={c(16)} c2={c(17)} c3={c(18)} c4={c(19)} />
        <BingoRow c0={c(20)} c1={c(21)} c2={c(22)} c3={c(23)} c4={c(24)} />
      </FlexWidget>

      {/* ── Footer ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          paddingTop: 6,
          paddingBottom: 8,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        <TextWidget
          text={recentGoal ? `✓ ${recentGoal.slice(0, 20)}` : '🌟 Start your journey!'}
          style={{ fontSize: 9, color: recentGoal ? '#4ade80' : '#475569', fontStyle: recentGoal ? 'normal' : 'italic' }}
        />
        <TextWidget text="Tap to open →" style={{ fontSize: 9, color: '#334155' }} />
      </FlexWidget>
    </FlexWidget>
  );
}
