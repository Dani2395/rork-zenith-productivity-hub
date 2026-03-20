"use no memo";
/**
 * Android home-screen widget — Notes Overview
 *
 * Shows total notes count, pinned notes count, and the most recent note title.
 * Tapping the widget opens the app's Notes screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface NotesWidgetProps {
  totalNotes: number;
  pinnedCount: number;
  latestNoteTitle: string;
  latestNoteDate: string;
}

export function NotesWidget({
  totalNotes,
  pinnedCount,
  latestNoteTitle,
  latestNoteDate,
}: NotesWidgetProps) {
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
        <TextWidget text="📝" style={{ fontSize: 14 }} />
        <TextWidget
          text=" Notes"
          style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <TextWidget text="Total" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${totalNotes}`}
          style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 'bold' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
        <TextWidget text="Pinned" style={{ fontSize: 11, color: '#94a3b8' }} />
        <TextWidget
          text={`${pinnedCount}`}
          style={{ fontSize: 11, color: pinnedCount > 0 ? '#fbbf24' : '#475569', fontWeight: 'bold' }}
        />
      </FlexWidget>

      <FlexWidget style={{ height: 1, backgroundColor: '#1e293b', marginTop: 6, marginBottom: 6 }} />

      {latestNoteTitle ? (
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text="Latest note"
            style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}
          />
          <TextWidget
            text={latestNoteTitle}
            style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 'bold' }}
          />
          {latestNoteDate ? (
            <TextWidget
              text={latestNoteDate}
              style={{ fontSize: 9, color: '#475569', marginTop: 2 }}
            />
          ) : null}
        </FlexWidget>
      ) : (
        <TextWidget
          text="No notes yet — write one!"
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
