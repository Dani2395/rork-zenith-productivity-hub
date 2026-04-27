"use no memo";
/**
 * Lock-screen-style widget — Top 5 Priorities (compact, minimal design)
 *
 * A slimmer, cleaner variant of PrioritiesWidget designed for lock screen
 * placement. Shows today's top-5 priorities as a minimal dot-list with
 * interactive checkboxes and a date header.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface LockScreenPriorityItemData {
  id: number;
  task: string;
  completed: boolean;
  overdue: boolean;
}

export interface LockScreenPrioritiesWidgetProps {
  dateLabel: string;
  completedCount: number;
  totalCount: number;
  priorities: LockScreenPriorityItemData[];
}

const APP_URI = 'rork-app:///';

function PriorityRow({ item }: { item: LockScreenPriorityItemData }) {
  "use no memo";
  const dotColor = item.completed ? '#4ade80' : item.overdue ? '#f87171' : '#c084fc';

  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 7,
        paddingBottom: 7,
        paddingLeft: 18,
        paddingRight: 16,
      }}
      clickAction="TOGGLE_LOCK_PRIORITY"
      clickActionData={{ priorityId: String(item.id) }}
    >
      {/* Status dot */}
      <FlexWidget
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: dotColor,
          marginRight: 12,
        }}
      />

      {/* Task name */}
      <TextWidget
        text={item.task}
        style={{
          fontSize: 13,
          color: item.completed ? '#3d3d5c' : '#dde1f0',
          fontWeight: item.completed ? 'normal' : 'bold',
          flex: 1,
        }}
      />

      {/* Overdue label */}
      {item.overdue && !item.completed ? (
        <TextWidget
          text="LATE"
          style={{
            fontSize: 8,
            color: '#f87171',
            fontWeight: 'bold',
            marginRight: 10,
          }}
        />
      ) : null}

      {/* Circular checkbox */}
      <FlexWidget
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 1.5,
          borderColor: item.completed ? '#4ade80' : '#2e2e4a',
          backgroundColor: item.completed ? '#14532d' : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {item.completed ? (
          <TextWidget
            text="✓"
            style={{ fontSize: 9, color: '#4ade80', fontWeight: 'bold' }}
          />
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}

export function LockScreenPrioritiesWidget({
  dateLabel,
  completedCount,
  totalCount,
  priorities = [],
}: LockScreenPrioritiesWidgetProps) {
  const allDone = totalCount > 0 && completedCount >= totalCount;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#07080f',
        borderRadius: 24,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: APP_URI }}
    >
      {/* ── Header ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
          paddingTop: 14,
          paddingBottom: 10,
          paddingLeft: 18,
          paddingRight: 16,
        }}
      >
        <FlexWidget
          style={{
            backgroundColor: '#c084fc22',
            borderRadius: 6,
            paddingTop: 3,
            paddingBottom: 3,
            paddingLeft: 7,
            paddingRight: 7,
            marginRight: 10,
            borderWidth: 1,
            borderColor: '#c084fc55',
          }}
        >
          <TextWidget
            text="LOCK SCREEN"
            style={{ fontSize: 8, color: '#c084fc', fontWeight: 'bold' }}
          />
        </FlexWidget>

        <TextWidget
          text="TOP 5 PRIORITIES"
          style={{ fontSize: 11, color: '#9ca3c8', fontWeight: 'bold', flex: 1 }}
        />

        <TextWidget
          text={dateLabel}
          style={{ fontSize: 9, color: '#3a3a5c' }}
        />
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget
        style={{
          height: 1,
          width: 'match_parent',
          backgroundColor: '#12132a',
          marginBottom: 2,
        }}
      />

      {/* ── Priority rows ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          flex: 1,
        }}
      >
        {priorities.length === 0 ? (
          <FlexWidget
            style={{
              width: 'match_parent',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            <TextWidget
              text="[ NO ACTIVE MISSIONS ]"
              style={{ fontSize: 10, color: '#2a2a40', fontStyle: 'italic' }}
            />
          </FlexWidget>
        ) : null}

        {priorities[0] ? <PriorityRow item={priorities[0]} /> : null}
        {priorities[1] ? <PriorityRow item={priorities[1]} /> : null}
        {priorities[2] ? <PriorityRow item={priorities[2]} /> : null}
        {priorities[3] ? <PriorityRow item={priorities[3]} /> : null}
        {priorities[4] ? <PriorityRow item={priorities[4]} /> : null}
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget
        style={{
          height: 1,
          width: 'match_parent',
          backgroundColor: '#12132a',
          marginTop: 2,
        }}
      />

      {/* ── Footer ── */}
      <FlexWidget
        style={{
          width: 'match_parent',
          paddingTop: 8,
          paddingBottom: 10,
          paddingLeft: 18,
          paddingRight: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {/* Progress bar background */}
        <FlexWidget
          style={{
            flex: 1,
            height: 3,
            backgroundColor: '#1a1a2e',
            borderRadius: 2,
            marginRight: 10,
          }}
        >
          {totalCount > 0 ? (
            <FlexWidget
              style={{
                width: `${Math.round((completedCount / totalCount) * 100)}%` as any,
                height: 3,
                backgroundColor: allDone ? '#4ade80' : '#c084fc',
                borderRadius: 2,
              }}
            />
          ) : null}
        </FlexWidget>

        <TextWidget
          text={`${completedCount} / ${totalCount} DONE`}
          style={{
            fontSize: 9,
            color: allDone ? '#4ade80' : '#555577',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
