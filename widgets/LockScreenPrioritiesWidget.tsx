"use no memo";
/**
 * Lock screen AppWidget — Top 5 Priorities (Samsung One UI compact style)
 *
 * Designed for the Samsung lock screen widget panel (One UI 5+).
 * The panel is narrow (~110-130dp tall) so every row is kept minimal:
 * a coloured dot, the task name, and a round checkbox — no badges or
 * sub-text that would push the height up.
 *
 * On Samsung S21 Ultra (One UI 5+):
 *   1. Long-press the lock screen
 *   2. Tap "Widgets"
 *   3. Find "Lock Screen Priorities" and drag it in
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
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 12,
        paddingRight: 12,
      }}
      clickAction="TOGGLE_LOCK_PRIORITY"
      clickActionData={{ priorityId: String(item.id) }}
    >
      {/* Coloured status dot */}
      <FlexWidget
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: dotColor,
          marginRight: 8,
        }}
      />

      {/* Task name — truncates naturally if too long */}
      <TextWidget
        text={item.task}
        style={{
          fontSize: 12,
          color: item.completed ? '#3a3a5c' : '#dde1f0',
          fontWeight: item.completed ? 'normal' : 'bold',
          flex: 1,
        }}
      />

      {/* Round checkbox */}
      <FlexWidget
        style={{
          width: 15,
          height: 15,
          borderRadius: 8,
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
            style={{ fontSize: 8, color: '#4ade80', fontWeight: 'bold' }}
          />
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}

export function LockScreenPrioritiesWidget({
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
        borderRadius: 16,
      }}
      clickAction="android.intent.action.VIEW"
      clickActionData={{ uri: APP_URI }}
    >
      {/* ── Compact header ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
          paddingTop: 8,
          paddingBottom: 6,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <TextWidget
          text="TOP PRIORITIES"
          style={{ fontSize: 9, color: '#c084fc', fontWeight: 'bold', flex: 1 }}
        />
        <TextWidget
          text={`${completedCount}/${totalCount}`}
          style={{
            fontSize: 9,
            color: allDone ? '#4ade80' : '#3a3a5c',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      {/* ── 1dp divider ── */}
      <FlexWidget
        style={{ height: 1, width: 'match_parent', backgroundColor: '#12132a' }}
      />

      {/* ── Priority rows ── */}
      <FlexWidget
        style={{ flexDirection: 'column', width: 'match_parent', flex: 1 }}
      >
        {priorities.length === 0 ? (
          <FlexWidget
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="No priorities set"
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
    </FlexWidget>
  );
}
