"use no memo";
/**
 * Android home-screen widget — Brain Dump
 *
 * Shows stats from the last brain dump and a prominent one-tap
 * "DUMP IT" button that launches the brain-dump screen.
 * Tapping anywhere on the widget opens rork-app:///brain-dump.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface BrainDumpWidgetProps {
  lastDumpDate: string;       // e.g. "Apr 6, 2026" or ''
  lastDumpPreview: string;    // first ~100 chars of raw text
  lastDumpTaskCount: number;  // tasks extracted in last dump
  totalDumps: number;         // all-time dump count
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BrainDumpWidget({
  lastDumpDate,
  lastDumpPreview,
  lastDumpTaskCount,
  totalDumps,
}: BrainDumpWidgetProps) {
  const hasHistory = !!lastDumpDate;

  return (
    <FlexWidget
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: 'rork-app:///brain-dump' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#0b0a14',
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
          paddingRight: 12,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text="c l e a r   y o u r   h e a d"
            style={{ fontSize: 8, color: '#a855f7', fontWeight: 'bold' }}
          />
          <TextWidget
            text="BRAIN DUMP"
            style={{ fontSize: 18, color: '#ffffff', fontWeight: 'bold', marginTop: 1 }}
          />
        </FlexWidget>

        {/* DUMP IT button */}
        <FlexWidget
          clickAction="android.intent.action.VIEW"
          clickActionData={{ uri: 'rork-app:///brain-dump' }}
          style={{
            backgroundColor: '#6366f1',
            borderRadius: 10,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 14,
            paddingRight: 14,
          }}
        >
          <TextWidget
            text="DUMP IT →"
            style={{ fontSize: 11, color: '#ffffff', fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1a1628' }} />

      {/* ── Body ── */}
      {!hasHistory ? (
        /* First-time empty state */
        <FlexWidget
          style={{
            flex: 1,
            width: 'match_parent',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          <TextWidget
            text="🧠"
            style={{ fontSize: 28 }}
          />
          <TextWidget
            text="Tap DUMP IT to clear your head"
            style={{ fontSize: 12, color: '#4a3860', marginTop: 8, textAlign: 'center' }}
          />
        </FlexWidget>
      ) : (
        <FlexWidget
          style={{
            flex: 1,
            width: 'match_parent',
            flexDirection: 'column',
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 12,
            paddingBottom: 10,
          }}
        >
          {/* Last dump meta row */}
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
              width: 'match_parent',
            }}
          >
            <TextWidget
              text={`Last dump: ${formatDate(lastDumpDate)}`}
              style={{ fontSize: 11, color: '#7c6aad', flex: 1 }}
            />
            {lastDumpTaskCount > 0 ? (
              <FlexWidget
                style={{
                  backgroundColor: '#1e1630',
                  borderRadius: 6,
                  paddingTop: 3,
                  paddingBottom: 3,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderWidth: 1,
                  borderColor: '#6366f155',
                }}
              >
                <TextWidget
                  text={`${lastDumpTaskCount} tasks pulled`}
                  style={{ fontSize: 9, color: '#6366f1', fontWeight: 'bold' }}
                />
              </FlexWidget>
            ) : null}
          </FlexWidget>

          {/* Preview text */}
          {lastDumpPreview ? (
            <TextWidget
              text={`"${lastDumpPreview}${lastDumpPreview.length >= 100 ? '…' : ''}"`}
              style={{
                fontSize: 11,
                color: '#4a3860',
                fontStyle: 'italic',
                flex: 1,
                lineHeight: 16,
              }}
            />
          ) : (
            <FlexWidget style={{ flex: 1 }} />
          )}
        </FlexWidget>
      )}

      {/* ── Footer ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1a1628' }} />
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 8,
          paddingBottom: 10,
        }}
      >
        <TextWidget
          text={totalDumps > 0 ? `${totalDumps} total dump${totalDumps !== 1 ? 's' : ''}` : 'No dumps yet'}
          style={{ fontSize: 10, color: '#2e2240' }}
        />
        <TextWidget
          text="🧠"
          style={{ fontSize: 14 }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
