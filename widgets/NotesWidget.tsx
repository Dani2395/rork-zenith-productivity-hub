"use no memo";
/**
 * Android home-screen widget — Notes (codex / journal aesthetic)
 *
 * Shows notes as a carousel: one note at a time with ‹ / › navigation.
 * Tapping the card opens the Notes screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface RecentNoteData {
  id: number;
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
  currentIndex?: number;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 10);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function NotesWidget({ totalNotes, pinnedCount, recentNotes = [], currentIndex = 0 }: NotesWidgetProps) {
  const safeIndex = recentNotes.length > 0 ? Math.max(0, Math.min(currentIndex, recentNotes.length - 1)) : 0;
  const note = recentNotes[safeIndex] ?? null;
  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < recentNotes.length - 1;

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
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          paddingTop: 14,
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 8,
        }}
      >
        <FlexWidget
          clickAction="android.intent.action.VIEW"
          clickActionData={{ uri: 'rork-app:///notes' }}
          style={{ flexDirection: 'column', flex: 1 }}
        >
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
          <FlexWidget
            clickAction="android.intent.action.VIEW"
            clickActionData={{ uri: 'rork-app:///notes?action=new' }}
            style={{
              width: 30,
              height: 30,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              backgroundColor: '#1e1c10',
              marginLeft: 8,
            }}
          >
            <TextWidget
              text="+"
              style={{ fontSize: 20, color: '#fbbf24', fontWeight: 'bold' }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1e1c10' }} />

      {/* ── Card body ── */}
      {recentNotes.length === 0 || !note ? (
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
        <FlexWidget
          clickAction="android.intent.action.VIEW"
          clickActionData={{ uri: `rork-app:///notes?noteId=${note.id}` }}
          style={{
            flex: 1,
            width: 'match_parent',
            flexDirection: 'column',
            paddingLeft: 18,
            paddingRight: 18,
            paddingTop: 14,
            paddingBottom: 10,
            backgroundColor: note.pinned ? '#12110a' : '#0e0d08',
          }}
        >
          {/* Pin + Title row */}
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: 'match_parent',
              marginBottom: 6,
            }}
          >
            <TextWidget
              text={note.pinned ? '★' : '·'}
              style={{
                fontSize: note.pinned ? 14 : 18,
                color: note.pinned ? '#fbbf24' : '#3a3820',
                marginRight: 8,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text={note.title}
              style={{
                fontSize: 15,
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

          {/* Preview text */}
          {note.preview ? (
            <TextWidget
              text={note.preview}
              style={{
                fontSize: 12,
                color: '#6b6540',
                marginLeft: 22,
                flex: 1,
              }}
            />
          ) : (
            <FlexWidget style={{ flex: 1 }} />
          )}
        </FlexWidget>
      )}

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1e1c10' }} />

      {/* ── Carousel navigation ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 8,
          paddingBottom: 10,
        }}
      >
        {/* Prev button */}
        <FlexWidget
          clickAction={hasPrev ? 'NOTES_PREV' : undefined}
          style={{
            width: 36,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            backgroundColor: hasPrev ? '#1e1c10' : 'transparent',
          }}
        >
          <TextWidget
            text="‹"
            style={{
              fontSize: 20,
              color: hasPrev ? '#fbbf24' : '#2a2820',
              fontWeight: 'bold',
            }}
          />
        </FlexWidget>

        {/* Index indicator + dots */}
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          {recentNotes.length > 0 ? (
            <>
              <TextWidget
                text={`${safeIndex + 1} / ${recentNotes.length}`}
                style={{ fontSize: 10, color: '#4a4830' }}
              />
              {recentNotes.length > 1 ? (
                <FlexWidget
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 4,
                  }}
                >
                  {recentNotes.slice(0, Math.min(recentNotes.length, 7)).map((_, i) => (
                    <FlexWidget
                      key={i}
                      style={{
                        width: i === safeIndex ? 8 : 5,
                        height: i === safeIndex ? 8 : 5,
                        borderRadius: 4,
                        backgroundColor: i === safeIndex ? '#fbbf24' : '#2a2820',
                        marginLeft: 2,
                        marginRight: 2,
                      }}
                    />
                  ))}
                </FlexWidget>
              ) : null}
            </>
          ) : null}
        </FlexWidget>

        {/* Next button */}
        <FlexWidget
          clickAction={hasNext ? 'NOTES_NEXT' : undefined}
          style={{
            width: 36,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            backgroundColor: hasNext ? '#1e1c10' : 'transparent',
          }}
        >
          <TextWidget
            text="›"
            style={{
              fontSize: 20,
              color: hasNext ? '#fbbf24' : '#2a2820',
              fontWeight: 'bold',
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
