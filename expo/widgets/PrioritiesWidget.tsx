"use no memo";
/**
 * Android home-screen widget — Top Priorities (TASK_OS cyberpunk style)
 *
 * Shows today's up-to-5 priorities as numbered rows with status badges
 * and interactive checkboxes. Tapping a row toggles completion.
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

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function getBadge(item: PriorityItemData): { color: string; label: string } {
  if (item.completed) return { color: '#3d3d5c', label: 'DONE' };
  if (item.overdue)   return { color: '#f87171', label: 'LATE' };
  if (item.subtaskTotal > 0) {
    const allSub = item.subtaskDone >= item.subtaskTotal;
    return allSub
      ? { color: '#34d399', label: `${item.subtaskDone}/${item.subtaskTotal}` }
      : { color: '#60a5fa', label: `${item.subtaskDone}/${item.subtaskTotal}` };
  }
  return { color: '#c084fc', label: 'TODO' };
}

function PriorityRow({ item, num }: { item: PriorityItemData; num: number }) {
  "use no memo";
  const badge = getBadge(item);

  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 9,
        paddingBottom: 9,
        paddingLeft: 14,
        paddingRight: 14,
      }}
      clickAction="TOGGLE_PRIORITY"
      clickActionData={{ priorityId: String(item.id) }}
    >
      {/* Row number */}
      <TextWidget
        text={pad(num)}
        style={{
          fontSize: 10,
          color: '#3d3d5c',
          fontWeight: 'bold',
          marginRight: 12,
          width: 18,
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

      {/* Status badge */}
      <FlexWidget
        style={{
          backgroundColor: item.completed ? '#1a1a2e' : `${badge.color}22`,
          borderRadius: 10,
          paddingTop: 3,
          paddingBottom: 3,
          paddingLeft: 7,
          paddingRight: 7,
          marginRight: 10,
          borderWidth: 1,
          borderColor: item.completed ? '#2a2a40' : badge.color,
        }}
      >
        <TextWidget
          text={badge.label}
          style={{
            fontSize: 9,
            color: item.completed ? '#3d3d5c' : badge.color,
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      {/* Checkbox */}
      <FlexWidget
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          borderWidth: 1.5,
          borderColor: item.completed ? '#4ade80' : '#3a3a5c',
          backgroundColor: item.completed ? '#14532d' : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {item.completed ? (
          <TextWidget
            text="✓"
            style={{ fontSize: 10, color: '#4ade80', fontWeight: 'bold' }}
          />
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}

export function PrioritiesWidget({ completedCount, totalCount, priorities = [] }: PrioritiesWidgetProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#0a0b14',
        borderRadius: 20,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: PRIORITIES_URI }}
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
          text="m i s s i o n   c o n t r o l"
          style={{ fontSize: 9, color: '#c084fc', fontWeight: 'bold' }}
        />
        <TextWidget
          text="PRIORITIES"
          style={{ fontSize: 22, color: '#ffffff', fontWeight: 'bold', marginTop: 2 }}
        />
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget
        style={{
          height: 1,
          width: 'match_parent',
          backgroundColor: '#1e2038',
          marginBottom: 4,
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
              paddingTop: 24,
              paddingBottom: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="[ NO ACTIVE MISSIONS ]"
              style={{ fontSize: 11, color: '#3d3d5c', fontStyle: 'italic' }}
            />
          </FlexWidget>
        ) : null}

        {priorities[0] ? <PriorityRow item={priorities[0]} num={1} /> : null}
        {priorities[1] ? <PriorityRow item={priorities[1]} num={2} /> : null}
        {priorities[2] ? <PriorityRow item={priorities[2]} num={3} /> : null}
        {priorities[3] ? <PriorityRow item={priorities[3]} num={4} /> : null}
        {priorities[4] ? <PriorityRow item={priorities[4]} num={5} /> : null}
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget
        style={{
          height: 1,
          width: 'match_parent',
          backgroundColor: '#1e2038',
          marginTop: 4,
        }}
      />

      {/* ── Footer ── */}
      <FlexWidget
        style={{
          width: 'match_parent',
          paddingTop: 8,
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text={`${completedCount} / ${totalCount} DONE`}
          style={{
            fontSize: 10,
            color: completedCount >= totalCount && totalCount > 0 ? '#4ade80' : '#34d399',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
