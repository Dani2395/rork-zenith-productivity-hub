"use no memo";
/**
 * Android home-screen widget — Habits Today
 *
 * Shows each habit as an individual row, plus a 7-day weekly heatmap
 * and a monthly progress bar. Tapping opens the Habits screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface HabitItemData {
  id: number;
  name: string;
  doneToday: boolean;
  streakDays: number;
}

export interface WeekDayData {
  label: string;
  pct: number;
  isToday: boolean;
}

export interface HabitsWidgetProps {
  habits: HabitItemData[];
  doneTodayCount: number;
  totalHabits: number;
  bestStreakName: string;
  bestStreakDays: number;
  weeklyPct: number;
  monthlyPct: number;
  weekDays: WeekDayData[];
}

const HABITS_URI = 'rork-app:///habits';

/** Returns dot background color from a completion percentage */
function dotBg(pct: number) {
  if (pct >= 80) return '#14532d';
  if (pct >= 50) return '#422006';
  if (pct >= 20) return '#431407';
  return '#1e293b';
}
function dotColor(pct: number) {
  if (pct >= 80) return '#4ade80';
  if (pct >= 50) return '#facc15';
  if (pct >= 20) return '#fb923c';
  return '#334155';
}

function WeekDot({ day }: { day: WeekDayData }) {
  "use no memo";
  const bg = day.isToday ? (day.pct >= 80 ? '#166534' : '#1e3a5f') : dotBg(day.pct);
  const color = day.isToday ? '#60a5fa' : dotColor(day.pct);
  const size = day.isToday ? 18 : 14;
  return (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <FlexWidget
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {day.pct >= 80 ? (
          <TextWidget text="✓" style={{ fontSize: 8, color: color, fontWeight: 'bold' }} />
        ) : day.pct > 0 ? (
          <TextWidget text="·" style={{ fontSize: 10, color: color, fontWeight: 'bold' }} />
        ) : null}
      </FlexWidget>
      <TextWidget
        text={day.label}
        style={{ fontSize: 8, color: day.isToday ? '#60a5fa' : '#475569', marginTop: 2 }}
      />
    </FlexWidget>
  );
}

function HabitRow({ habit }: { habit: HabitItemData }) {
  "use no memo";
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 4,
        paddingRight: 4,
      }}
      clickAction="TOGGLE_HABIT"
      clickActionData={{ habitId: String(habit.id) }}
    >
      <FlexWidget
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: habit.doneToday ? '#14532d' : '#1e293b',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
        }}
      >
        <TextWidget
          text={habit.doneToday ? '✓' : '○'}
          style={{ fontSize: 11, color: habit.doneToday ? '#4ade80' : '#475569', fontWeight: 'bold' }}
        />
      </FlexWidget>
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget
          text={habit.name}
          style={{
            fontSize: 12,
            color: habit.doneToday ? '#64748b' : '#e2e8f0',
            fontWeight: habit.doneToday ? 'normal' : 'bold',
          }}
        />
      </FlexWidget>
      {habit.streakDays > 0 ? (
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: habit.doneToday ? '#431407' : '#1c1917',
            borderRadius: 8,
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: 5,
            paddingRight: 5,
          }}
        >
          <TextWidget text="🔥" style={{ fontSize: 8 }} />
          <TextWidget
            text={` ${habit.streakDays}d`}
            style={{ fontSize: 9, color: '#fb923c', fontWeight: 'bold' }}
          />
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}

export function HabitsWidget({
  habits = [],
  doneTodayCount,
  totalHabits,
  bestStreakName,
  bestStreakDays,
  weeklyPct = 0,
  monthlyPct = 0,
  weekDays = [],
}: HabitsWidgetProps) {
  const pct = totalHabits > 0 ? Math.round((doneTodayCount / totalHabits) * 100) : 0;
  const allDone = totalHabits > 0 && doneTodayCount >= totalHabits;
  const pctColor = allDone ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171';

  // Progress bar: filled flex + empty flex (min 1 each to avoid 0-flex issues)
  const barFilled = Math.max(1, monthlyPct);
  const barEmpty = Math.max(1, 100 - monthlyPct);
  const monthBarColor = monthlyPct >= 80 ? '#15803d' : monthlyPct >= 50 ? '#a16207' : monthlyPct >= 30 ? '#9a3412' : '#1d4ed8';

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
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text="🔥" style={{ fontSize: 15 }} />
          <TextWidget
            text="  My Habits"
            style={{ fontSize: 14, fontWeight: 'bold', color: '#f1f5f9' }}
          />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text={`${doneTodayCount}/${totalHabits}  `}
            style={{ fontSize: 10, color: '#94a3b8' }}
          />
          <FlexWidget
            style={{
              backgroundColor: allDone ? '#14532d' : '#431407',
              borderRadius: 10,
              paddingTop: 3,
              paddingBottom: 3,
              paddingLeft: 7,
              paddingRight: 7,
            }}
          >
            <TextWidget
              text={`${pct}%`}
              style={{ fontSize: 11, color: pctColor, fontWeight: 'bold' }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* ── Weekly heatmap ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        {/* Row: label + dots + pct */}
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
          <TextWidget text="Week" style={{ fontSize: 9, color: '#64748b', marginRight: 6 }} />
          <FlexWidget style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {weekDays[0] ? <WeekDot day={weekDays[0]} /> : null}
            {weekDays[1] ? <WeekDot day={weekDays[1]} /> : null}
            {weekDays[2] ? <WeekDot day={weekDays[2]} /> : null}
            {weekDays[3] ? <WeekDot day={weekDays[3]} /> : null}
            {weekDays[4] ? <WeekDot day={weekDays[4]} /> : null}
            {weekDays[5] ? <WeekDot day={weekDays[5]} /> : null}
            {weekDays[6] ? <WeekDot day={weekDays[6]} /> : null}
          </FlexWidget>
          <TextWidget
            text={`${weeklyPct}%`}
            style={{ fontSize: 10, color: dotColor(weeklyPct), fontWeight: 'bold', marginLeft: 6 }}
          />
        </FlexWidget>

        {/* Monthly progress bar */}
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent', marginTop: 6 }}>
          <TextWidget text="Month" style={{ fontSize: 9, color: '#64748b', marginRight: 6 }} />
          <FlexWidget style={{ flex: 1, height: 6, borderRadius: 3, flexDirection: 'row', backgroundColor: '#1e293b' }}>
            <FlexWidget style={{ flex: barFilled, height: 6, borderRadius: 3, backgroundColor: monthBarColor }} />
            <FlexWidget style={{ flex: barEmpty, height: 6 }} />
          </FlexWidget>
          <TextWidget
            text={`  ${monthlyPct}%`}
            style={{ fontSize: 10, color: dotColor(monthlyPct), fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── Thin divider ── */}
      <FlexWidget
        style={{ height: 1, width: 'match_parent', backgroundColor: '#1e293b', marginLeft: 14, marginRight: 14, marginTop: 2, marginBottom: 2 }}
      />

      {/* ── Habit rows ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          paddingLeft: 10,
          paddingRight: 10,
          paddingTop: 2,
          paddingBottom: 2,
        }}
      >
        {habits.length === 0 ? (
          <FlexWidget style={{ width: 'match_parent', paddingTop: 14, paddingBottom: 14, alignItems: 'center' }}>
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
          paddingTop: 7,
          paddingBottom: 9,
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
