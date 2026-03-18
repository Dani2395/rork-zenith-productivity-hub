/**
 * Android home-screen widget — Calendar / Agenda
 *
 * Shows today's date, event count, and the next upcoming event.
 * Tapping the widget opens the app's Calendar screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface CalendarWidgetProps {
  todayLabel: string;   // e.g. "Wednesday, Mar 18"
  eventCount: number;
  nextEventName: string;
  nextEventTime: string;
}

export function CalendarWidget({
  todayLabel,
  eventCount,
  nextEventName,
  nextEventTime,
}: CalendarWidgetProps) {
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
        <TextWidget text="📅" style={{ fontSize: 14 }} />
        <TextWidget
          text={` ${todayLabel}`}
          style={{ fontSize: 12, fontWeight: 'bold', color: '#e2e8f0' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <TextWidget text="Events today" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${eventCount}`}
          style={{ fontSize: 11, color: eventCount > 0 ? '#818cf8' : '#475569', fontWeight: 'bold' }}
        />
      </FlexWidget>

      <FlexWidget style={{ height: 1, backgroundColor: '#1e293b', marginTop: 6, marginBottom: 6 }} />

      {nextEventName ? (
        <>
          <TextWidget
            text="Next up"
            style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}
          />
          <TextWidget
            text={nextEventName}
            style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 'bold' }}
          />
          {nextEventTime ? (
            <TextWidget
              text={nextEventTime}
              style={{ fontSize: 10, color: '#818cf8', marginTop: 2 }}
            />
          ) : null}
        </>
      ) : (
        <TextWidget
          text="Nothing scheduled today 🌴"
          style={{ fontSize: 10, color: '#475569', fontStyle: 'italic' }}
        />
      )}

      <TextWidget
        text="Tap to open Zenith"
        style={{ fontSize: 9, color: '#475569', marginTop: 6, textAlign: 'right' }}
      />
    </FlexWidget>
  );
}
