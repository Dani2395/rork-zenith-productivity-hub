"use no memo";
/**
 * Android home-screen widget — Notes (codex / journal aesthetic)
 *
 * Shows recent notes with pinned markers, title, and date.
 * Tapping opens the Notes screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface RecentNoteData {
  title: string;
  date: string;
  pinned: boolean;
}

export interface NotesWidgetProps {
  totalNotes: number;
  pinnedCount: number;
  latestNoteTitle: string;
  latestNoteDate: string;
  recentNotes: RecentNoteData[];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 10);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function NoteRow({ note }: { note: RecentNoteData }) {
  "use no memo";
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 14,
        paddingRight: 14,
      }}
    >
      {/* Pin marker */}
      <TextWidget
        text={note.pinned ? '★' : '·'}
        style={{
          fontSize: note.pinned ? 13 : 16,
          color: note.pinned ? '#fbbf24' : '#2a2820',
          marginRight: 10,
          fontWeight: 'bold',
        }}
      />

      {/* Title */}
      <TextWidget
        text={note.title}
        style={{
          fontSize: 12,
          color: note.pinned ? '#fef3c7' : '#d6d0c4',
          fontWeight: note.pinned ? 'bold' : 'normal',
          flex: 1,
        }}
      />

      {/* Date chip */}
      {note.date ? (
        <FlexWidget
          style={{
            backgroundColor: '#1a1910',
            borderRadius: 6,
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: 5,
            paddingRight: 5,
            borderWidth: 1,
            borderColor: '#2a2820',
          }}
        >
          <TextWidget
            text={formatDate(note.date)}
            style={{ fontSize: 9, color: '#4a4830', fontWeight: 'bold' }}
          />
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}

export function NotesWidget({ totalNotes, pinnedCount, recentNotes = [] }: NotesWidgetProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#0e0d08',
        borderRadius: 20,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: 'rork-app:///notes' }}
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
          text="y o u r   c o d e x"
          style={{ fontSize: 9, color: '#a16207', fontWeight: 'bold' }}
        />
        <TextWidget
          text="NOTES"
          style={{ fontSize: 22, color: '#ffffff', fontWeight: 'bold', marginTop: 2 }}
        />
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1e1c10' }} />

      {/* ── Notes list ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          flex: 1,
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        {recentNotes.length === 0 ? (
          <FlexWidget
            style={{
              width: 'match_parent',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="[ CODEX EMPTY ]"
              style={{ fontSize: 11, color: '#2a2820', fontStyle: 'italic' }}
            />
          </FlexWidget>
        ) : null}

        {recentNotes[0] ? <NoteRow note={recentNotes[0]} /> : null}
        {recentNotes[1] ? <NoteRow note={recentNotes[1]} /> : null}
        {recentNotes[2] ? <NoteRow note={recentNotes[2]} /> : null}
        {recentNotes[3] ? <NoteRow note={recentNotes[3]} /> : null}
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1e1c10' }} />

      {/* ── Footer: stats ── */}
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
        <TextWidget
          text={`${totalNotes} ENTRIES`}
          style={{ fontSize: 9, color: '#4a4830', fontWeight: 'bold' }}
        />
        {pinnedCount > 0 ? (
          <TextWidget
            text={`★ ${pinnedCount} PINNED`}
            style={{ fontSize: 9, color: '#a16207', fontWeight: 'bold' }}
          />
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}
