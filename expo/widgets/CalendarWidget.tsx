"use no memo";
/**
 * Android home-screen widget — Calendar / Agenda (timeline aesthetic)
 *
 * Shows today's large day number, month, and up to 4 events with times.
 * Tapping opens the Calendar screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface CalendarEventData {
  name: string;
  time: string;
}

export interface CalendarWidgetProps {
  todayLabel: string;
  dayNumber: string;
  dayName: string;
  monthName: string;
  eventCount: number;
  nextEventName: string;
  nextEventTime: string;
  events: CalendarEventData[];
}

const EVENT_COLORS = ['#818cf8', '#34d399', '#fb923c', '#f472b6'];

export function CalendarWidget({
  dayNumber,
  dayName,
  monthName,
  eventCount,
  events = [],
  todayLabel,
}: CalendarWidgetProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#09090f',
        borderRadius: 20,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: 'rork-app:///calendar' }}
    >
      {/* ── Header: day number + month ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
          paddingTop: 14,
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        {/* Big day number */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#12103a',
            borderRadius: 14,
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 14,
            paddingRight: 14,
            marginRight: 14,
            borderWidth: 1,
            borderColor: '#2d2b5e',
          }}
        >
          <TextWidget
            text={dayNumber}
            style={{ fontSize: 28, fontWeight: 'bold', color: '#818cf8' }}
          />
          <TextWidget
            text={dayName}
            style={{ fontSize: 9, color: '#4a4880', fontWeight: 'bold', marginTop: 2 }}
          />
        </FlexWidget>

        {/* Month + event count */}
        <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
          <TextWidget
            text={monthName}
            style={{ fontSize: 11, color: '#4a4880', fontWeight: 'bold' }}
          />
          <TextWidget
            text={eventCount === 0 ? 'No events' : `${eventCount} event${eventCount !== 1 ? 's' : ''}`}
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: eventCount > 0 ? '#e2e0ff' : '#2a2840',
              marginTop: 2,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#12103a' }} />

      {/* ── Event list ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          flex: 1,
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        {events.length === 0 ? (
          <FlexWidget
            style={{
              width: 'match_parent',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="[ CLEAR SCHEDULE ]"
              style={{ fontSize: 11, color: '#1e1c3a', fontStyle: 'italic' }}
            />
          </FlexWidget>
        ) : null}

        {events[0] ? (
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: 'match_parent',
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            <FlexWidget
              style={{
                backgroundColor: '#12103a',
                borderRadius: 6,
                paddingTop: 3,
                paddingBottom: 3,
                paddingLeft: 6,
                paddingRight: 6,
                marginRight: 10,
                borderWidth: 1,
                borderColor: EVENT_COLORS[0],
              }}
            >
              <TextWidget text={events[0].time || '--:--'} style={{ fontSize: 9, color: EVENT_COLORS[0], fontWeight: 'bold' }} />
            </FlexWidget>
            <TextWidget text={events[0].name} style={{ fontSize: 12, color: '#c8c6ff', fontWeight: 'bold', flex: 1 }} />
          </FlexWidget>
        ) : null}

        {events[1] ? (
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: 'match_parent',
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            <FlexWidget
              style={{
                backgroundColor: '#12103a',
                borderRadius: 6,
                paddingTop: 3,
                paddingBottom: 3,
                paddingLeft: 6,
                paddingRight: 6,
                marginRight: 10,
                borderWidth: 1,
                borderColor: EVENT_COLORS[1],
              }}
            >
              <TextWidget text={events[1].time || '--:--'} style={{ fontSize: 9, color: EVENT_COLORS[1], fontWeight: 'bold' }} />
            </FlexWidget>
            <TextWidget text={events[1].name} style={{ fontSize: 12, color: '#c8c6ff', fontWeight: 'bold', flex: 1 }} />
          </FlexWidget>
        ) : null}

        {events[2] ? (
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: 'match_parent',
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            <FlexWidget
              style={{
                backgroundColor: '#12103a',
                borderRadius: 6,
                paddingTop: 3,
                paddingBottom: 3,
                paddingLeft: 6,
                paddingRight: 6,
                marginRight: 10,
                borderWidth: 1,
                borderColor: EVENT_COLORS[2],
              }}
            >
              <TextWidget text={events[2].time || '--:--'} style={{ fontSize: 9, color: EVENT_COLORS[2], fontWeight: 'bold' }} />
            </FlexWidget>
            <TextWidget text={events[2].name} style={{ fontSize: 12, color: '#c8c6ff', fontWeight: 'bold', flex: 1 }} />
          </FlexWidget>
        ) : null}

        {events[3] ? (
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: 'match_parent',
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            <FlexWidget
              style={{
                backgroundColor: '#12103a',
                borderRadius: 6,
                paddingTop: 3,
                paddingBottom: 3,
                paddingLeft: 6,
                paddingRight: 6,
                marginRight: 10,
                borderWidth: 1,
                borderColor: EVENT_COLORS[3],
              }}
            >
              <TextWidget text={events[3].time || '--:--'} style={{ fontSize: 9, color: EVENT_COLORS[3], fontWeight: 'bold' }} />
            </FlexWidget>
            <TextWidget text={events[3].name} style={{ fontSize: 12, color: '#c8c6ff', fontWeight: 'bold', flex: 1 }} />
          </FlexWidget>
        ) : null}
      </FlexWidget>

      {/* ── Divider + footer ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#12103a' }} />
      <FlexWidget
        style={{
          width: 'match_parent',
          paddingTop: 7,
          paddingBottom: 9,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        <TextWidget
          text={todayLabel.toUpperCase()}
          style={{ fontSize: 9, color: '#2d2b5e', fontWeight: 'bold' }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
