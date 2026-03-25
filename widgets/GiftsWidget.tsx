"use no memo";
/**
 * Android home-screen widget — Gifts
 *
 * Shows people and their gift lists, matching the in-app layout.
 * Uses a flat ListWidget so each row is its own tappable item.
 * Tapping any row opens the Gifts screen.
 */

import React from 'react';
import { FlexWidget, ListWidget, TextWidget } from 'react-native-android-widget';

const TAG_EMOJIS: Record<string, string> = {
  family: '👨‍👩‍👧',
  friend: '👥',
  coworker: '💼',
  other: '✨',
};

export interface GiftItemData {
  id: number;
  name: string;
  event?: string;
  price?: string;
  purchased: boolean;
}

export interface GiftPersonData {
  id: number;
  name: string;
  tag: string;
  gifts: GiftItemData[];
}

export interface GiftsWidgetProps {
  peopleCount: number;
  totalGifts: number;
  purchasedCount: number;
  nextEventLabel: string;
  people?: GiftPersonData[];
}

// Flat list item types
type PersonHeaderItem = { kind: 'person'; person: GiftPersonData; purchasedCount: number; allDone: boolean };
type GiftRowItem = { kind: 'gift'; gift: GiftItemData };
type ListItem = PersonHeaderItem | GiftRowItem;

function flattenItems(people: GiftPersonData[]): ListItem[] {
  const items: ListItem[] = [];
  for (const person of people) {
    const purchasedCount = person.gifts.filter(g => g.purchased).length;
    const allDone = person.gifts.length > 0 && purchasedCount === person.gifts.length;
    items.push({ kind: 'person', person, purchasedCount, allDone });
    for (const gift of person.gifts) {
      items.push({ kind: 'gift', gift });
    }
  }
  return items;
}

function PersonHeaderRow({ person, purchasedCount, allDone }: PersonHeaderItem) {
  "use no memo";
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'rork-app:///gifts' }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 14,
        paddingRight: 14,
        backgroundColor: '#13131a',
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Tag emoji */}
      <TextWidget
        text={TAG_EMOJIS[person.tag] ?? '✨'}
        style={{ fontSize: 18, marginRight: 10 }}
      />

      {/* Name */}
      <TextWidget
        text={person.name}
        style={{ fontSize: 14, color: '#e5e7eb', fontWeight: 'bold', flex: 1 }}
      />

      {/* Bought/total badge */}
      <FlexWidget
        style={{
          backgroundColor: allDone ? '#052e16' : '#1e1b4b',
          borderRadius: 10,
          paddingTop: 3,
          paddingBottom: 3,
          paddingLeft: 9,
          paddingRight: 9,
          borderWidth: 1,
          borderColor: allDone ? '#10b981' : '#6366f1',
        }}
      >
        <TextWidget
          text={`${purchasedCount}/${person.gifts.length} gifts`}
          style={{ fontSize: 10, color: allDone ? '#10b981' : '#a5b4fc', fontWeight: 'bold' }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

function GiftRowWidget({ gift }: { gift: GiftItemData }) {
  "use no memo";
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'rork-app:///gifts' }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 9,
        paddingBottom: 9,
        paddingLeft: 42,
        paddingRight: 14,
        backgroundColor: '#0a0a0f',
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      {/* Checkbox */}
      <FlexWidget
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          borderWidth: 1.5,
          borderColor: gift.purchased ? '#10b981' : 'rgba(255,255,255,0.2)',
          backgroundColor: gift.purchased ? '#052e16' : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
        }}
      >
        {gift.purchased ? (
          <TextWidget text="✓" style={{ fontSize: 11, color: '#10b981', fontWeight: 'bold' }} />
        ) : null}
      </FlexWidget>

      {/* Gift name */}
      <TextWidget
        text={gift.name}
        style={{
          fontSize: 13,
          color: gift.purchased ? '#6b7280' : '#e5e7eb',
          flex: 1,
        }}
      />

      {/* Right side: event + price stacked */}
      <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
        {gift.event ? (
          <TextWidget
            text={gift.event}
            style={{ fontSize: 9, color: '#9ca3af' }}
          />
        ) : null}
        {gift.price ? (
          <TextWidget
            text={gift.price}
            style={{ fontSize: 10, color: '#a5b4fc', fontWeight: 'bold', marginTop: 1 }}
          />
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}

function renderItem(item: ListItem, i: number) {
  "use no memo";
  if (item.kind === 'person') {
    return <PersonHeaderRow key={i} {...item} />;
  }
  return <GiftRowWidget key={i} gift={item.gift} />;
}

export function GiftsWidget({ peopleCount, totalGifts, purchasedCount, people = [] }: GiftsWidgetProps) {
  const remaining = totalGifts - purchasedCount;
  const pct = totalGifts > 0 ? Math.round((purchasedCount / totalGifts) * 100) : 0;
  const allDone = totalGifts > 0 && remaining === 0;
  const flatItems = flattenItems(people);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#0a0a0f',
        borderRadius: 20,
      }}
    >
      {/* ── Header ── */}
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'rork-app:///gifts' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          paddingTop: 14,
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 16,
          backgroundColor: '#13131a',
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text="🎁"
            style={{ fontSize: 20, marginRight: 8 }}
          />
          <FlexWidget style={{ flexDirection: 'column' }}>
            <TextWidget
              text="Gift Ideas"
              style={{ fontSize: 18, color: '#e5e7eb', fontWeight: 'bold' }}
            />
            <TextWidget
              text={`${peopleCount} ${peopleCount === 1 ? 'person' : 'people'}`}
              style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* Stats */}
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <TextWidget
            text={`${purchasedCount}/${totalGifts}`}
            style={{ fontSize: 15, color: allDone ? '#10b981' : '#a855f7', fontWeight: 'bold' }}
          />
          <TextWidget
            text={`${pct}% bought`}
            style={{ fontSize: 9, color: '#9ca3af', marginTop: 1 }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── Progress bar ── */}
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 3,
          backgroundColor: '#1e1b4b',
          flexDirection: 'row',
        }}
      >
        {pct > 0 ? (
          <FlexWidget
            style={{
              flex: Math.max(1, pct),
              height: 3,
              backgroundColor: allDone ? '#10b981' : '#6366f1',
            }}
          />
        ) : null}
        {pct < 100 ? (
          <FlexWidget style={{ flex: Math.max(1, 100 - pct), height: 3 }} />
        ) : null}
      </FlexWidget>

      {/* ── Scrollable list ── */}
      {flatItems.length === 0 ? (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'rork-app:///gifts' }}
          style={{ width: 'match_parent', flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <TextWidget text="No people added yet" style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }} />
          <TextWidget text="Tap to open and add people" style={{ fontSize: 10, color: '#4b5563', marginTop: 6 }} />
        </FlexWidget>
      ) : (
        <ListWidget style={{ width: 'match_parent', flex: 1, backgroundColor: '#0a0a0f' }}>
          {flatItems.map((item, i) => renderItem(item, i))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}
