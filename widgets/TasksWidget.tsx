"use no memo";
/**
 * Android home-screen widget — My Tasks (Google Tasks-style)
 *
 * Shows today's tasks as individual rows with priority dots, times,
 * and overdue indicators. Tapping opens the Tasks screen.
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

const PRIORITY_COLOR: Record<string, string> = {
  high: '#f87171',
  medium: '#facc15',
  low: '#4ade80',
};

export function TasksWidget({ tasks = [], todayTotal, todayDone, overdueCount }: TasksWidgetProps) {
  const allDone = todayTotal > 0 && todayDone >= todayTotal;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#111827',
        borderRadius: 20,
      }}
      clickAction="OPEN_APP"
    >
      {/* ── Header ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1e2a3a',
          borderRadius: 20,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text="📋" style={{ fontSize: 15 }} />
          <TextWidget
            text="  My Tasks"
            style={{ fontSize: 15, fontWeight: 'bold', color: '#f1f5f9' }}
          />
        </FlexWidget>
        <FlexWidget
          style={{
            backgroundColor: allDone ? '#166534' : '#1d4ed8',
            borderRadius: 10,
            paddingTop: 3,
            paddingBottom: 3,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          <TextWidget
            text={`${todayDone} / ${todayTotal}`}
            style={{ fontSize: 11, color: '#ffffff', fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── Task rows ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          paddingLeft: 10,
          paddingRight: 10,
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        {tasks.length === 0 ? (
          <FlexWidget
            style={{
              paddingTop: 18,
              paddingBottom: 18,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="✨  All clear for today!"
              style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}
            />
          </FlexWidget>
        ) : null}

        {tasks[0] ? (
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 4,
              paddingRight: 4,
            }}
            clickAction="OPEN_APP"
          >
            <TextWidget
              text={tasks[0].completed ? '✓' : '○'}
              style={{
                fontSize: 15,
                color: tasks[0].completed ? '#4ade80' : (tasks[0].overdue ? '#f87171' : '#60a5fa'),
                marginRight: 10,
                fontWeight: 'bold',
              }}
            />
            <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
              <TextWidget
                text={tasks[0].name}
                style={{
                  fontSize: 13,
                  color: tasks[0].completed ? '#475569' : (tasks[0].overdue ? '#fca5a5' : '#e2e8f0'),
                  fontWeight: tasks[0].completed ? 'normal' : 'bold',
                }}
              />
              {tasks[0].time ? (
                <TextWidget
                  text={tasks[0].time}
                  style={{ fontSize: 10, color: tasks[0].overdue ? '#f87171' : '#64748b', marginTop: 1 }}
                />
              ) : null}
            </FlexWidget>
            <FlexWidget
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: PRIORITY_COLOR[tasks[0].priority] ?? '#94a3b8',
              }}
            />
          </FlexWidget>
        ) : null}

        {tasks[1] ? (
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 4,
              paddingRight: 4,
            }}
            clickAction="OPEN_APP"
          >
            <TextWidget
              text={tasks[1].completed ? '✓' : '○'}
              style={{
                fontSize: 15,
                color: tasks[1].completed ? '#4ade80' : (tasks[1].overdue ? '#f87171' : '#60a5fa'),
                marginRight: 10,
                fontWeight: 'bold',
              }}
            />
            <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
              <TextWidget
                text={tasks[1].name}
                style={{
                  fontSize: 13,
                  color: tasks[1].completed ? '#475569' : (tasks[1].overdue ? '#fca5a5' : '#e2e8f0'),
                  fontWeight: tasks[1].completed ? 'normal' : 'bold',
                }}
              />
              {tasks[1].time ? (
                <TextWidget
                  text={tasks[1].time}
                  style={{ fontSize: 10, color: tasks[1].overdue ? '#f87171' : '#64748b', marginTop: 1 }}
                />
              ) : null}
            </FlexWidget>
            <FlexWidget
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: PRIORITY_COLOR[tasks[1].priority] ?? '#94a3b8',
              }}
            />
          </FlexWidget>
        ) : null}

        {tasks[2] ? (
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 4,
              paddingRight: 4,
            }}
            clickAction="OPEN_APP"
          >
            <TextWidget
              text={tasks[2].completed ? '✓' : '○'}
              style={{
                fontSize: 15,
                color: tasks[2].completed ? '#4ade80' : (tasks[2].overdue ? '#f87171' : '#60a5fa'),
                marginRight: 10,
                fontWeight: 'bold',
              }}
            />
            <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
              <TextWidget
                text={tasks[2].name}
                style={{
                  fontSize: 13,
                  color: tasks[2].completed ? '#475569' : (tasks[2].overdue ? '#fca5a5' : '#e2e8f0'),
                  fontWeight: tasks[2].completed ? 'normal' : 'bold',
                }}
              />
              {tasks[2].time ? (
                <TextWidget
                  text={tasks[2].time}
                  style={{ fontSize: 10, color: tasks[2].overdue ? '#f87171' : '#64748b', marginTop: 1 }}
                />
              ) : null}
            </FlexWidget>
            <FlexWidget
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: PRIORITY_COLOR[tasks[2].priority] ?? '#94a3b8',
              }}
            />
          </FlexWidget>
        ) : null}

        {tasks[3] ? (
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 4,
              paddingRight: 4,
            }}
            clickAction="OPEN_APP"
          >
            <TextWidget
              text={tasks[3].completed ? '✓' : '○'}
              style={{
                fontSize: 15,
                color: tasks[3].completed ? '#4ade80' : (tasks[3].overdue ? '#f87171' : '#60a5fa'),
                marginRight: 10,
                fontWeight: 'bold',
              }}
            />
            <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
              <TextWidget
                text={tasks[3].name}
                style={{
                  fontSize: 13,
                  color: tasks[3].completed ? '#475569' : (tasks[3].overdue ? '#fca5a5' : '#e2e8f0'),
                  fontWeight: tasks[3].completed ? 'normal' : 'bold',
                }}
              />
              {tasks[3].time ? (
                <TextWidget
                  text={tasks[3].time}
                  style={{ fontSize: 10, color: tasks[3].overdue ? '#f87171' : '#64748b', marginTop: 1 }}
                />
              ) : null}
            </FlexWidget>
            <FlexWidget
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: PRIORITY_COLOR[tasks[3].priority] ?? '#94a3b8',
              }}
            />
          </FlexWidget>
        ) : null}

        {tasks[4] ? (
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 4,
              paddingRight: 4,
            }}
            clickAction="OPEN_APP"
          >
            <TextWidget
              text={tasks[4].completed ? '✓' : '○'}
              style={{
                fontSize: 15,
                color: tasks[4].completed ? '#4ade80' : (tasks[4].overdue ? '#f87171' : '#60a5fa'),
                marginRight: 10,
                fontWeight: 'bold',
              }}
            />
            <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
              <TextWidget
                text={tasks[4].name}
                style={{
                  fontSize: 13,
                  color: tasks[4].completed ? '#475569' : (tasks[4].overdue ? '#fca5a5' : '#e2e8f0'),
                  fontWeight: tasks[4].completed ? 'normal' : 'bold',
                }}
              />
              {tasks[4].time ? (
                <TextWidget
                  text={tasks[4].time}
                  style={{ fontSize: 10, color: tasks[4].overdue ? '#f87171' : '#64748b', marginTop: 1 }}
                />
              ) : null}
            </FlexWidget>
            <FlexWidget
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: PRIORITY_COLOR[tasks[4].priority] ?? '#94a3b8',
              }}
            />
          </FlexWidget>
        ) : null}
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget
        style={{ height: 1, backgroundColor: '#1e293b', marginLeft: 14, marginRight: 14 }}
      />

      {/* ── Footer ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        {overdueCount > 0 ? (
          <TextWidget
            text={`⚠  ${overdueCount} overdue`}
            style={{ fontSize: 10, color: '#f87171', fontWeight: 'bold' }}
          />
        ) : (
          <TextWidget
            text={allDone ? '🎉  All done!' : ''}
            style={{ fontSize: 10, color: '#4ade80', fontWeight: 'bold' }}
          />
        )}
        <TextWidget
          text="Tap to open →"
          style={{ fontSize: 9, color: '#334155' }}
        />
      </FlexWidget>

      {/* ── Priority legend ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingBottom: 10,
          paddingLeft: 14,
        }}
      >
        <FlexWidget style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#f87171', marginRight: 4 }} />
        <TextWidget text="High  " style={{ fontSize: 9, color: '#475569' }} />
        <FlexWidget style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#facc15', marginRight: 4 }} />
        <TextWidget text="Med  " style={{ fontSize: 9, color: '#475569' }} />
        <FlexWidget style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80', marginRight: 4 }} />
        <TextWidget text="Low" style={{ fontSize: 9, color: '#475569' }} />
      </FlexWidget>
    </FlexWidget>
  );
}
