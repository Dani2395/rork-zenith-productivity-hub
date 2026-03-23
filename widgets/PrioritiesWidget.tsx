"use no memo";
/**
 * Android home-screen widget — Top Priorities (Google Tasks-style)
 *
 * Shows today's up-to-5 priorities as individual rows with subtask
 * progress and overdue indicators. Tapping opens the Home screen.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface PriorityItemData {
  id: number;
  task: string;
  completed: boolean;
  overdue: boolean;
  subtaskTotal: number;
  subtaskDone: number;
}

export interface PrioritiesWidgetProps {
  todayLabel: string;
  completedCount: number;
  totalCount: number;
  nextPriority: string;
  priorities: PriorityItemData[];
}

const PRIORITIES_URI = 'rork-app:///';

function PriorityRow({ item, num }: { item: PriorityItemData; num: number }) {
  "use no memo";
  const hasSubtasks = item.subtaskTotal > 0;
  const subtaskLabel = hasSubtasks ? `${item.subtaskDone}/${item.subtaskTotal} subtasks` : '';

  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 7,
        paddingBottom: 7,
        paddingLeft: 4,
        paddingRight: 4,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: PRIORITIES_URI }}
    >
      {/* Number badge */}
      <FlexWidget
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: item.completed ? '#14532d' : (item.overdue ? '#7f1d1d' : '#1e3a5f'),
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
        }}
      >
        <TextWidget
          text={item.completed ? '✓' : String(num)}
          style={{
            fontSize: 11,
            color: item.completed ? '#4ade80' : (item.overdue ? '#f87171' : '#93c5fd'),
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      {/* Task + subtask info */}
      <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
        <TextWidget
          text={item.task}
          style={{
            fontSize: 13,
            color: item.completed ? '#475569' : (item.overdue ? '#fca5a5' : '#f1f5f9'),
            fontWeight: item.completed ? 'normal' : 'bold',
          }}
        />
        {hasSubtasks ? (
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <TextWidget
              text="↳ "
              style={{ fontSize: 10, color: '#475569' }}
            />
            <TextWidget
              text={subtaskLabel}
              style={{
                fontSize: 10,
                color: item.subtaskDone === item.subtaskTotal ? '#4ade80' : '#64748b',
              }}
            />
          </FlexWidget>
        ) : null}
      </FlexWidget>

      {item.overdue && !item.completed ? (
        <TextWidget text="!" style={{ fontSize: 12, color: '#f87171', fontWeight: 'bold', marginLeft: 4 }} />
      ) : null}
    </FlexWidget>
  );
}

export function PrioritiesWidget({ todayLabel, completedCount, totalCount, nextPriority, priorities = [] }: PrioritiesWidgetProps) {
  const allDone = totalCount > 0 && completedCount >= totalCount;

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
      clickActionData={{ uri: PRIORITIES_URI }}
    >
      {/* ── Header ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          backgroundColor: '#1a2a1a',
          borderRadius: 20,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextWidget text="⭐" style={{ fontSize: 14 }} />
            <TextWidget
              text="  Top Priorities"
              style={{ fontSize: 15, fontWeight: 'bold', color: '#f1f5f9' }}
            />
          </FlexWidget>
          <TextWidget
            text={todayLabel}
            style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}
          />
        </FlexWidget>
        <FlexWidget
          style={{
            backgroundColor: allDone ? '#166534' : '#365314',
            borderRadius: 10,
            paddingTop: 3,
            paddingBottom: 3,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          <TextWidget
            text={`${completedCount} / ${totalCount}`}
            style={{ fontSize: 11, color: '#ffffff', fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── Priority rows ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          paddingLeft: 10,
          paddingRight: 10,
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        {priorities.length === 0 ? (
          <FlexWidget
            style={{
              width: 'match_parent',
              paddingTop: 20,
              paddingBottom: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="✨  Add your priorities for today"
              style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}
            />
          </FlexWidget>
        ) : null}

        {priorities[0] ? (
          <PriorityRow item={priorities[0]} num={1} />
        ) : null}
        {priorities[1] ? (
          <PriorityRow item={priorities[1]} num={2} />
        ) : null}
        {priorities[2] ? (
          <PriorityRow item={priorities[2]} num={3} />
        ) : null}
        {priorities[3] ? (
          <PriorityRow item={priorities[3]} num={4} />
        ) : null}
        {priorities[4] ? (
          <PriorityRow item={priorities[4]} num={5} />
        ) : null}
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget
        style={{ height: 1, width: 'match_parent', backgroundColor: '#1e293b', marginLeft: 14, marginRight: 14 }}
      />

      {/* ── Footer ── */}
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
        {allDone ? (
          <TextWidget
            text="🎉  All priorities done!"
            style={{ fontSize: 10, color: '#4ade80', fontWeight: 'bold' }}
          />
        ) : (
          <TextWidget
            text={nextPriority ? `Next: ${nextPriority}` : ''}
            style={{ fontSize: 10, color: '#94a3b8' }}
          />
        )}
        <TextWidget
          text="Tap to open →"
          style={{ fontSize: 9, color: '#334155' }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
