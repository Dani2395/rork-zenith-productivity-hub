"use no memo";
/**
 * Android home-screen widget — Habits Today (gardener / nature aesthetic)
 *
 * Each habit row shows an emoji icon tile, name, weekly frequency label,
 * colored progress dots, and streak counter. Footer shows gardener level
 * + XP bar. Tapping a row toggles today's completion.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface HabitItemData {
  id: number;
  name: string;
  doneToday: boolean;
  streakDays: number;
  weeklyDone: number;
  emoji: string;
  color: string;
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

function levelName(pct: number): string {
  if (pct >= 90) return 'Botanist';
  if (pct >= 70) return 'Gardener';
  if (pct >= 50) return 'Grower';
  if (pct >= 30) return 'Sprout';
  return 'Seedling';
}

/** Renders up to 5 progress dots (filled = done days this week, empty = remaining) */
function ProgressDots({ done, color }: { done: number; color: string }) {
  "use no memo";
  const filled = Math.min(done, 5);
  const empty = 5 - filled;
  return (
    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
      {filled >= 1 ? <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} /> : null}
      {filled >= 2 ? <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} /> : null}
      {filled >= 3 ? <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} /> : null}
      {filled >= 4 ? <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} /> : null}
      {filled >= 5 ? <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} /> : null}
      {empty >= 1 ? <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2e2a', marginRight: 4 }} /> : null}
      {empty >= 2 ? <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2e2a', marginRight: 4 }} /> : null}
      {empty >= 3 ? <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2e2a', marginRight: 4 }} /> : null}
      {empty >= 4 ? <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2e2a', marginRight: 4 }} /> : null}
      {empty >= 5 ? <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2e2a', marginRight: 4 }} /> : null}
    </FlexWidget>
  );
}

function HabitRow({ habit }: { habit: HabitItemData }) {
  "use no memo";
  const dotColor = habit.doneToday ? habit.color : habit.color + '88';

  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 12,
        paddingRight: 12,
      }}
      clickAction="TOGGLE_HABIT"
      clickActionData={{ habitId: String(habit.id) }}
    >
      {/* Emoji icon tile */}
      <FlexWidget
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: habit.doneToday ? '#1e2d1e' : '#1a211a',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <TextWidget text={habit.emoji} style={{ fontSize: 22 }} />
      </FlexWidget>

      {/* Name + frequency + dots */}
      <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
        <TextWidget
          text={habit.name}
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: habit.doneToday ? '#6b7b6b' : '#e8ede8',
          }}
        />
        <TextWidget
          text={`${habit.weeklyDone}× this week`}
          style={{ fontSize: 10, color: '#4a5e4a', marginTop: 1, marginBottom: 4 }}
        />
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ProgressDots done={habit.weeklyDone} color={dotColor} />
          <TextWidget
            text={`  ${habit.streakDays}d`}
            style={{ fontSize: 10, color: '#4ade80', fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

export function HabitsWidget({
  habits = [],
  doneTodayCount,
  totalHabits,
  weeklyPct = 0,
  monthlyPct = 0,
}: HabitsWidgetProps) {
  const level = levelName(weeklyPct);
  const xpFilled = Math.max(1, doneTodayCount > 0 ? doneTodayCount : 1);
  const xpEmpty = Math.max(1, totalHabits > doneTodayCount ? totalHabits - doneTodayCount : 1);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#151a15',
        borderRadius: 20,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: HABITS_URI }}
    >
      {/* ── Habit rows ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          flex: 1,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        {habits.length === 0 ? (
          <FlexWidget
            style={{
              width: 'match_parent',
              paddingTop: 30,
              paddingBottom: 30,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="🌱  Add your first habit"
              style={{ fontSize: 12, color: '#4a5e4a' }}
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
        style={{ height: 1, width: 'match_parent', backgroundColor: '#1e2a1e' }}
      />

      {/* ── Footer: gardener level + XP ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          paddingTop: 8,
          paddingBottom: 10,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        {/* Label row */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: 'match_parent',
            marginBottom: 2,
          }}
        >
          <FlexWidget style={{ flexDirection: 'column' }}>
            <TextWidget
              text="gardener level"
              style={{ fontSize: 9, color: '#4a5e4a' }}
            />
            <TextWidget
              text={level}
              style={{ fontSize: 12, color: '#4ade80', fontWeight: 'bold' }}
            />
          </FlexWidget>
          <TextWidget
            text={`${doneTodayCount} / ${totalHabits} xp`}
            style={{ fontSize: 10, color: '#4a5e4a' }}
          />
        </FlexWidget>

        {/* XP progress bar */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            width: 'match_parent',
            height: 5,
            borderRadius: 3,
            backgroundColor: '#1e2a1e',
            marginTop: 4,
            overflow: 'hidden',
          }}
        >
          <FlexWidget
            style={{
              flex: xpFilled,
              height: 5,
              borderRadius: 3,
              backgroundColor: '#4ade80',
            }}
          />
          <FlexWidget style={{ flex: xpEmpty, height: 5 }} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
