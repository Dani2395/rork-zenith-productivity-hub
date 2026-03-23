"use no memo";
/**
 * Android home-screen widget — 2026 Bingo Goals (full 5×5 interactive card)
 *
 * Each cell is individually tappable to toggle completion.
 * Done cells glow green, free space is gold, pending cells are dark.
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
const EMPTY_CELL: BingoCellData = { emoji: '', text: '', done: false, isFreeSpace: false };

function BingoCell({ cell, index }: { cell: BingoCellData; index: number }) {
  "use no memo";
  if (!cell) return null;

  const bg = cell.isFreeSpace
    ? '#2d1f06'
    : cell.done
    ? '#0c2e1a'
    : '#0e0e18';

  const borderColor = cell.isFreeSpace
    ? '#92400e'
    : cell.done
    ? '#16a34a'
    : '#1e1e2e';

  const textColor = cell.isFreeSpace
    ? '#fde68a'
    : cell.done
    ? '#86efac'
    : '#2a2a3e';

  const label = cell.isFreeSpace ? 'FREE' : (cell.text.length > 5 ? cell.text.slice(0, 5) : cell.text);

  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        borderRadius: 8,
        margin: 2,
        paddingTop: 5,
        paddingBottom: 5,
        borderWidth: 1,
        borderColor: borderColor,
      }}
      clickAction={cell.isFreeSpace ? 'android.intent.action.VIEW' : 'TOGGLE_BINGO'}
      clickActionData={cell.isFreeSpace ? { uri: BINGO_URI } : { cellIndex: String(index) }}
    >
      <TextWidget
        text={cell.isFreeSpace ? '⭐' : cell.emoji}
        style={{ fontSize: 13, textAlign: 'center' }}
      />
      <TextWidget
        text={label}
        style={{ fontSize: 7, color: textColor, textAlign: 'center', marginTop: 1, fontWeight: cell.done ? 'bold' : 'normal' }}
      />
      {cell.done && !cell.isFreeSpace ? (
        <TextWidget text="✓" style={{ fontSize: 7, color: '#4ade80', fontWeight: 'bold' }} />
      ) : null}
    </FlexWidget>
  );
}

function BingoRow({ c0, c1, c2, c3, c4, startIndex }: {
  c0: BingoCellData; c1: BingoCellData; c2: BingoCellData; c3: BingoCellData; c4: BingoCellData; startIndex: number;
}) {
  "use no memo";
  return (
    <FlexWidget style={{ flexDirection: 'row', flex: 1, width: 'match_parent', paddingLeft: 6, paddingRight: 6 }}>
      <BingoCell cell={c0} index={startIndex}     />
      <BingoCell cell={c1} index={startIndex + 1} />
      <BingoCell cell={c2} index={startIndex + 2} />
      <BingoCell cell={c3} index={startIndex + 3} />
      <BingoCell cell={c4} index={startIndex + 4} />
    </FlexWidget>
  );
}

export function BingoWidget({ cells = [], completedCount, hasBingo, recentGoal }: BingoWidgetProps) {
  const pct = Math.round((completedCount / 25) * 100);
  const barFilled = Math.max(1, pct);
  const barEmpty = Math.max(1, 100 - pct);
  const c = (i: number): BingoCellData => cells[i] ?? EMPTY_CELL;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#090910',
        borderRadius: 20,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: BINGO_URI }}
    >
      {/* ── Header ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          width: 'match_parent',
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text={hasBingo ? '2026 BINGO  🎉' : '2026 BINGO'}
            style={{ fontSize: 16, color: '#ffffff', fontWeight: 'bold' }}
          />
        </FlexWidget>
        {/* Progress bar under title */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            width: 'match_parent',
            paddingLeft: 20,
            paddingRight: 20,
            marginTop: 6,
            alignItems: 'center',
          }}
        >
          <FlexWidget
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              flexDirection: 'row',
              backgroundColor: '#1a1a28',
              overflow: 'hidden',
              marginRight: 8,
            }}
          >
            <FlexWidget
              style={{
                flex: barFilled,
                height: 4,
                borderRadius: 2,
                backgroundColor: hasBingo ? '#fbbf24' : '#818cf8',
              }}
            />
            <FlexWidget style={{ flex: barEmpty, height: 4 }} />
          </FlexWidget>
          <TextWidget
            text={`${completedCount}/25`}
            style={{ fontSize: 9, color: hasBingo ? '#fbbf24' : '#4a4880', fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── 5×5 Grid ── */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          width: 'match_parent',
          paddingTop: 2,
          paddingBottom: 4,
        }}
      >
        <BingoRow c0={c(0)}  c1={c(1)}  c2={c(2)}  c3={c(3)}  c4={c(4)}  startIndex={0}  />
        <BingoRow c0={c(5)}  c1={c(6)}  c2={c(7)}  c3={c(8)}  c4={c(9)}  startIndex={5}  />
        <BingoRow c0={c(10)} c1={c(11)} c2={c(12)} c3={c(13)} c4={c(14)} startIndex={10} />
        <BingoRow c0={c(15)} c1={c(16)} c2={c(17)} c3={c(18)} c4={c(19)} startIndex={15} />
        <BingoRow c0={c(20)} c1={c(21)} c2={c(22)} c3={c(23)} c4={c(24)} startIndex={20} />
      </FlexWidget>

      {/* ── Footer ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1a1a28' }} />
      <FlexWidget
        style={{
          width: 'match_parent',
          paddingTop: 6,
          paddingBottom: 8,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        <TextWidget
          text={recentGoal ? `✓ ${recentGoal.slice(0, 28)}` : '[ TAP CELLS TO MARK GOALS ]'}
          style={{
            fontSize: 9,
            color: recentGoal ? '#4ade80' : '#1e1e30',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
