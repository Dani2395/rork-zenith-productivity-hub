"use no memo";
/**
 * Android home-screen widget — Notes (codex / journal aesthetic)
 *
 * Shows notes in a scrollable list with pinned markers, title, and date.
 * Tapping opens the Notes screen.
 */

import React from 'react';
import { FlexWidget, ListWidget, TextWidget } from 'react-native-android-widget';

export interface RecentNoteData {
  title: string;
  date: string;
  pinned: boolean;
  preview?: string;
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
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: 'rork-app:///notes' }}
      style={{
        flexDirection: 'column',
        width: 'match_parent',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 14,
        paddingRight: 14,
        borderBottomWidth: 1,
        borderColor: '#1e1c10',
        backgroundColor: note.pinned ? '#12110a' : '#0e0d08',
      }}
    >
      {/* Title row */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={note.pinned ? '★' : '·'}
          style={{
            fontSize: note.pinned ? 13 : 16,
            color: note.pinned ? '#fbbf24' : '#3a3820',
            marginRight: 8,
            fontWeight: 'bold',
          }}
        />
        <TextWidget
          text={note.title}
          style={{
            fontSize: 13,
            color: note.pinned ? '#fef3c7' : '#d6d0c4',
            fontWeight: note.pinned ? 'bold' : 'normal',
            flex: 1,
          }}
        />
        {note.date ? (
          <TextWidget
            text={formatDate(note.date)}
            style={{ fontSize: 10, color: '#4a4830' }}
          />
        ) : null}
      </FlexWidget>

      {/* Preview line */}
      {note.preview ? (
        <TextWidget
          text={note.preview}
          style={{
            fontSize: 11,
            color: '#3a3820',
            marginTop: 3,
            marginLeft: 21,
          }}
        />
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
    >
      {/* ── Header ── */}
      <FlexWidget
        clickAction="android.intent.action.VIEW"
        clickActionData={{ uri: 'rork-app:///notes' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          paddingTop: 14,
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text="y o u r   c o d e x"
            style={{ fontSize: 8, color: '#a16207', fontWeight: 'bold' }}
          />
          <TextWidget
            text="NOTES"
            style={{ fontSize: 20, color: '#ffffff', fontWeight: 'bold', marginTop: 1 }}
          />
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          {pinnedCount > 0 ? (
            <TextWidget
              text={`★ ${pinnedCount}  `}
              style={{ fontSize: 11, color: '#a16207', fontWeight: 'bold' }}
            />
          ) : null}
          <TextWidget
            text={`${totalNotes} entries`}
            style={{ fontSize: 10, color: '#4a4830' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1e1c10' }} />

      {/* ── Scrollable notes list ── */}
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
      ) : (
        <ListWidget
          style={{
            width: 'match_parent',
            flex: 1,
            backgroundColor: '#0e0d08',
          }}
        >
          {recentNotes.map((note, i) => (
            <NoteRow key={i} note={note} />
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}
