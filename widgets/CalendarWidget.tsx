"use no memo";
/**
 * Android home-screen widget — Calendar
 *
 * Shows a tappable 7-day week strip + scrollable schedule for the selected day.
 * - Tap any day in the strip to see that day's schedule
 * - Tap < / > arrows to navigate weeks
 * - Tap the header or any schedule item to open the Calendar screen
 */

import React from 'react';
import { FlexWidget, ListWidget, TextWidget } from 'react-native-android-widget';

export interface DayData {
  dateStr: string;
  dayNum: number;
  dayName: string;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
  hasTasks: boolean;
}

export interface CalendarScheduleItem {
  type: 'event' | 'task' | 'priority' | 'workout' | 'note';
  emoji: string;
  name: string;
  time?: string;
  desc?: string;
  done?: boolean;
  overdue?: boolean;
}

export interface CalendarWidgetProps {
  // legacy fields kept for backward compat
  todayLabel: string;
  dayNumber: string;
  dayName: string;
  monthName: string;
  eventCount: number;
  nextEventName: string;
  nextEventTime: string;
  events: { name: string; time: string }[];
  // new fields
  monthYear?: string;
  selectedDate?: string;
  selectedDayLabel?: string;
  weekDays?: DayData[];
  scheduleItems?: CalendarScheduleItem[];
}

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function DayCell({ day }: { day: DayData }) {
  "use no memo";
  const bg = day.isSelected
    ? '#6366f1'
    : day.isToday
    ? '#1e1b4b'
    : 'transparent';
  const numColor = day.isSelected ? '#fff' : day.isToday ? '#818cf8' : '#9ca3af';
  const nameColor = day.isSelected ? '#c7d2fe' : day.isToday ? '#6366f1' : '#4b5563';

  return (
    <FlexWidget
      clickAction="SELECT_DATE"
      clickActionData={{ date: day.dateStr }}
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 6,
        paddingBottom: 6,
        backgroundColor: bg,
        borderRadius: 10,
        marginLeft: 2,
        marginRight: 2,
      }}
    >
      <TextWidget
        text={day.dayName}
        style={{ fontSize: 9, color: nameColor, fontWeight: 'bold' }}
      />
      <TextWidget
        text={String(day.dayNum)}
        style={{ fontSize: 15, color: numColor, fontWeight: 'bold', marginTop: 2 }}
      />
      {/* Dot indicators */}
      <FlexWidget style={{ flexDirection: 'row', marginTop: 3, height: 5 }}>
        {day.hasEvents ? (
          <FlexWidget
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: day.isSelected ? '#c7d2fe' : '#818cf8',
              marginRight: 2,
            }}
          />
        ) : null}
        {day.hasTasks ? (
          <FlexWidget
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: day.isSelected ? '#fde68a' : '#f59e0b',
            }}
          />
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}

function ScheduleRow({ item }: { item: CalendarScheduleItem }) {
  "use no memo";
  const dimmed = item.done;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'rork-app:///calendar' }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 14,
        paddingRight: 14,
        backgroundColor: '#09090f',
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      {/* Emoji icon */}
      <FlexWidget
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: dimmed ? '#111' : item.overdue ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
        }}
      >
        <TextWidget text={item.emoji} style={{ fontSize: 15 }} />
      </FlexWidget>

      {/* Content */}
      <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
        <TextWidget
          text={item.name}
          style={{
            fontSize: 13,
            color: dimmed ? '#4b5563' : item.overdue ? '#f87171' : '#e5e7eb',
            fontWeight: dimmed ? 'normal' : 'bold',
          }}
        />
        {item.desc ? (
          <TextWidget
            text={item.desc}
            style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}
          />
        ) : null}
      </FlexWidget>

      {/* Time */}
      {item.time ? (
        <TextWidget
          text={item.time}
          style={{ fontSize: 11, color: '#818cf8', fontWeight: 'bold', marginLeft: 8 }}
        />
      ) : null}
    </FlexWidget>
  );
}

export function CalendarWidget({
  monthYear,
  selectedDate,
  selectedDayLabel,
  weekDays = [],
  scheduleItems = [],
  // legacy fallbacks
  dayNumber,
  dayName,
  monthName,
  eventCount,
  events = [],
  todayLabel,
}: CalendarWidgetProps) {
  // If new data not provided, fall back to legacy display
  const isNewFormat = !!monthYear && weekDays.length > 0;

  if (!isNewFormat) {
    // Legacy fallback (won't be hit after first widget update)
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          flexDirection: 'column',
          backgroundColor: '#09090f',
          borderRadius: 20,
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'rork-app:///calendar' }}
      >
        <FlexWidget style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <TextWidget text={dayNumber} style={{ fontSize: 48, color: '#818cf8', fontWeight: 'bold' }} />
          <TextWidget text={monthName} style={{ fontSize: 14, color: '#4a4880', marginTop: 4 }} />
        </FlexWidget>
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#09090f',
        borderRadius: 20,
      }}
    >
      {/* ── Header ── */}
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'rork-app:///calendar' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          paddingTop: 12,
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          backgroundColor: '#13131a',
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text="📅" style={{ fontSize: 18, marginRight: 8 }} />
          <TextWidget
            text={monthYear ?? ''}
            style={{ fontSize: 16, color: '#e5e7eb', fontWeight: 'bold' }}
          />
        </FlexWidget>
        <TextWidget
          text="Open →"
          style={{ fontSize: 10, color: '#6366f1' }}
        />
      </FlexWidget>

      {/* ── Week strip with nav arrows ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 8,
          paddingRight: 8,
          backgroundColor: '#0d0d14',
        }}
      >
        {/* ← prev week */}
        <FlexWidget
          clickAction="PREV_WEEK"
          clickActionData={{ dummy: '1' }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: '#1e1b4b',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 4,
          }}
        >
          <TextWidget text="‹" style={{ fontSize: 16, color: '#818cf8', fontWeight: 'bold' }} />
        </FlexWidget>

        {/* Day cells */}
        {weekDays.map((day, i) => (
          <DayCell key={i} day={day} />
        ))}

        {/* → next week */}
        <FlexWidget
          clickAction="NEXT_WEEK"
          clickActionData={{ dummy: '1' }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: '#1e1b4b',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 4,
          }}
        >
          <TextWidget text="›" style={{ fontSize: 16, color: '#818cf8', fontWeight: 'bold' }} />
        </FlexWidget>
      </FlexWidget>

      {/* ── Selected day label ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          paddingTop: 6,
          paddingBottom: 6,
          paddingLeft: 14,
          paddingRight: 14,
          borderBottomWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <TextWidget
          text={selectedDayLabel ?? ''}
          style={{ fontSize: 12, color: '#818cf8', fontWeight: 'bold' }}
        />
        <TextWidget
          text={scheduleItems.length === 0 ? 'Nothing scheduled' : `${scheduleItems.length} item${scheduleItems.length !== 1 ? 's' : ''}`}
          style={{ fontSize: 10, color: '#4b5563' }}
        />
      </FlexWidget>

      {/* ── Scrollable schedule ── */}
      {scheduleItems.length === 0 ? (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'rork-app:///calendar' }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: 'match_parent' }}
        >
          <TextWidget text="✨ Free day" style={{ fontSize: 13, color: '#4b5563' }} />
          <TextWidget text="Tap to add events" style={{ fontSize: 10, color: '#374151', marginTop: 4 }} />
        </FlexWidget>
      ) : (
        <ListWidget style={{ flex: 1, width: 'match_parent', backgroundColor: '#09090f' }}>
          {scheduleItems.map((item, i) => (
            <ScheduleRow key={i} item={item} />
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}
