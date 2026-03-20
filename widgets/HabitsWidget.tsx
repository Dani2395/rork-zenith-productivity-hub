"use no memo";
/**
 * Android home-screen widget — Habits Today (Google Tasks-style)
 *
 * Shows each habit as an individual row with ○/✓ indicator, streak
 * days, and an overall percentage. Tapping opens the Habits screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface HabitItemData {
  id: number;
  name: string;
  doneToday: boolean;
  streakDays: number;
}

export interface HabitsWidgetProps {
  habits: HabitItemData[];
  doneTodayCount: number;
  totalHabits: number;
  bestStreakName: string;
  bestStreakDays: number;
}

const HABITS_URI = 'rork-app:///habits';

function HabitRow({ habit }: { habit: HabitItemData }) {
  "use no memo";
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 4,
        paddingRight: 4,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: HABITS_URI }}
    >
      {/* Circle indicator */}
      <FlexWidget
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: habit.doneToday ? '#14532d' : '#1e293b',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
        }}
      >
        <TextWidget
          text={habit.doneToday ? '✓' : '○'}
          style={{
            fontSize: 12,
            color: habit.doneToday ? '#4ade80' : '#475569',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      {/* Habit name */}
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget
          text={habit.name}
          style={{
            fontSize: 13,
            color: habit.doneToday ? '#64748b' : '#e2e8f0',
            fontWeight: habit.doneToday ? 'normal' : 'bold',
          }}
        />
      </FlexWidget>

      {/* Streak badge */}
      {habit.streakDays > 0 ? (
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: habit.doneToday ? '#431407' : '#1c1917',
            borderRadius: 8,
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: 6,
            paddingRight: 6,
          }}
        >
          <TextWidget text="🔥" style={{ fontSize: 9 }} />
          <TextWidget
            text={` ${habit.streakDays}d`}
            style={{ fontSize: 10, color: '#fb923c', fontWeight: 'bold' }}
          />
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}

export function HabitsWidget({ habits = [], doneTodayCount, totalHabits, bestStreakName, bestStreakDays }: HabitsWidgetProps) {
  const pct = totalHabits > 0 ? Math.round((doneTodayCount / totalHabits) * 100) : 0;
  const allDone = totalHabits > 0 && doneTodayCount >= totalHabits;
  const pctColor = allDone ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171';

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
      clickActionData={{ uri: HABITS_URI }}
    >
      {/* ── Header ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          backgroundColor: '#1c1a0f',
          borderRadius: 20,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text="🔥" style={{ fontSize: 15 }} />
          <TextWidget
            text="  My Habits"
            style={{ fontSize: 15, fontWeight: 'bold', color: '#f1f5f9' }}
          />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text={`${doneTodayCount}/${totalHabits}  `}
            style={{ fontSize: 11, color: '#94a3b8' }}
          />
          <FlexWidget
            style={{
              backgroundColor: allDone ? '#14532d' : '#431407',
              borderRadius: 10,
              paddingTop: 3,
              paddingBottom: 3,
              paddingLeft: 8,
              paddingRight: 8,
            }}
          >
            <TextWidget
              text={`${pct}%`}
              style={{ fontSize: 11, color: pctColor, fontWeight: 'bold' }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* ── Habit rows ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          paddingLeft: 10,
          paddingRight: 10,
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        {habits.length === 0 ? (
          <FlexWidget style={{ width: 'match_parent', paddingTop: 20, paddingBottom: 20, alignItems: 'center' }}>
            <TextWidget
              text="✨  Add your first habit!"
              style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}
            />
          </FlexWidget>
        ) : null}

        {habits[0] ? <HabitRow habit={habits[0]} /> : null}
        {habits[1] ? <HabitRow habit={habits[1]} /> : null}
        {habits[2] ? <HabitRow habit={habits[2]} /> : null}
        {habits[3] ? <HabitRow habit={habits[3]} /> : null}
        {habits[4] ? <HabitRow habit={habits[4]} /> : null}
        {habits[5] ? <HabitRow habit={habits[5]} /> : null}
        {habits[6] ? <HabitRow habit={habits[6]} /> : null}
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget
        style={{ height: 1, width: 'match_parent', backgroundColor: '#1e293b', marginLeft: 14, marginRight: 14 }}
      />

      {/* ── Footer: best streak ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          paddingTop: 8,
          paddingBottom: 10,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        {bestStreakName && bestStreakDays > 0 ? (
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextWidget text="🏆 " style={{ fontSize: 10 }} />
            <TextWidget
              text={`${bestStreakName}  🔥${bestStreakDays}d`}
              style={{ fontSize: 10, color: '#fb923c' }}
            />
          </FlexWidget>
        ) : (
          <TextWidget text="" style={{ fontSize: 10, color: 'transparent' }} />
        )}
        <TextWidget
          text="Tap to open →"
          style={{ fontSize: 9, color: '#334155' }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
