"use no memo";
/**
 * Android home-screen widget — My Tasks (TASK_OS cyberpunk style)
 *
 * Shows today's tasks as numbered rows with priority badges and
 * interactive checkboxes. Tapping a row toggles completion.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface TaskItemData {
  id: number;
  name: string;
  completed: boolean;
  overdue: boolean;
  priority: 'low' | 'medium' | 'high';
  time?: string;
}

export interface TasksWidgetProps {
  tasks: TaskItemData[];
  todayTotal: number;
  todayDone: number;
  overdueCount: number;
  nextTask: string;
}

const BADGE: Record<string, { color: string; label: string }> = {
  high:   { color: '#f472b6', label: 'HIGH'   },
  medium: { color: '#fb923c', label: 'MED'    },
  low:    { color: '#34d399', label: 'LOW'    },
  late:   { color: '#f87171', label: 'LATE'   },
};

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function TaskRow({ item, num }: { item: TaskItemData; num: number }) {
  "use no memo";
  const badge = item.overdue && !item.completed ? BADGE.late : (BADGE[item.priority] ?? BADGE.low);

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
      clickAction="TOGGLE_TASK"
      clickActionData={{ taskId: String(item.id) }}
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
        text={item.name}
        style={{
          fontSize: 13,
          color: item.completed ? '#3d3d5c' : '#dde1f0',
          fontWeight: item.completed ? 'normal' : 'bold',
          flex: 1,
        }}
      />

      {/* Priority / status badge */}
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
          text={item.completed ? 'DONE' : badge.label}
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

export function TasksWidget({ tasks = [], todayTotal, todayDone }: TasksWidgetProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#0a0b14',
        borderRadius: 20,
      }}
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
          style={{ fontSize: 9, color: '#c084fc', fontWeight: 'bold', letterSpacing: 2 }}
        />
        <TextWidget
          text="TASK_OS"
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

      {/* ── Task rows ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          flex: 1,
        }}
      >
        {tasks.length === 0 ? (
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

        {tasks[0] ? <TaskRow item={tasks[0]} num={1} /> : null}
        {tasks[1] ? <TaskRow item={tasks[1]} num={2} /> : null}
        {tasks[2] ? <TaskRow item={tasks[2]} num={3} /> : null}
        {tasks[3] ? <TaskRow item={tasks[3]} num={4} /> : null}
        {tasks[4] ? <TaskRow item={tasks[4]} num={5} /> : null}
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
          text={`${todayDone} / ${todayTotal} DONE`}
          style={{
            fontSize: 10,
            color: todayDone >= todayTotal && todayTotal > 0 ? '#4ade80' : '#34d399',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
