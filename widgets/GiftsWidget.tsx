"use no memo";
/**
 * Android home-screen widget — Gifts
 *
 * Shows people and their gift lists, matching the in-app layout.
 * Tapping opens the Gifts screen.
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

function GiftRow({ gift, personId }: { gift: GiftItemData; personId: number }) {
  "use no memo";
  return (
    <FlexWidget
      clickAction="TOGGLE_GIFT"
      clickActionData={{ giftId: String(gift.id), personId: String(personId) }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingTop: 7,
        paddingBottom: 7,
        paddingLeft: 36,
        paddingRight: 14,
        backgroundColor: '#0f0810',
        borderBottomWidth: 1,
        borderColor: '#16102a',
      }}
    >
      {/* Purchased checkbox */}
      <FlexWidget
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          borderWidth: 1.5,
          borderColor: gift.purchased ? '#4ade80' : '#3a2860',
          backgroundColor: gift.purchased ? '#14532d' : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
        }}
      >
        {gift.purchased ? (
          <TextWidget
            text="✓"
            style={{ fontSize: 10, color: '#4ade80', fontWeight: 'bold' }}
          />
        ) : null}
      </FlexWidget>

      {/* Gift name */}
      <TextWidget
        text={gift.name}
        style={{
          fontSize: 12,
          color: gift.purchased ? '#3a2860' : '#d4bfff',
          flex: 1,
          fontWeight: gift.purchased ? 'normal' : 'bold',
        }}
      />

      {/* Event tag */}
      {gift.event ? (
        <TextWidget
          text={gift.event.split(' ').slice(0, 2).join(' ')}
          style={{ fontSize: 9, color: '#6b3fa0', marginLeft: 6 }}
        />
      ) : null}

      {/* Price */}
      {gift.price ? (
        <TextWidget
          text={gift.price}
          style={{ fontSize: 9, color: '#4a3860', marginLeft: 6 }}
        />
      ) : null}
    </FlexWidget>
  );
}

function PersonSection({ person }: { person: GiftPersonData }) {
  "use no memo";
  const purchasedCount = person.gifts.filter(g => g.purchased).length;
  const allDone = person.gifts.length > 0 && purchasedCount === person.gifts.length;

  return (
    <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
      {/* Person header */}
      <FlexWidget
        clickAction="android.intent.action.VIEW"
        clickActionData={{ uri: 'rork-app:///gifts' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 14,
          paddingRight: 14,
          backgroundColor: '#150d22',
          borderBottomWidth: 1,
          borderColor: '#2e1f40',
        }}
      >
        <TextWidget
          text={TAG_EMOJIS[person.tag] ?? '✨'}
          style={{ fontSize: 16, marginRight: 10 }}
        />
        <TextWidget
          text={person.name}
          style={{ fontSize: 14, color: '#e8d5ff', fontWeight: 'bold', flex: 1 }}
        />
        <FlexWidget
          style={{
            backgroundColor: allDone ? '#0a1f14' : '#1a0f22',
            borderRadius: 8,
            paddingTop: 3,
            paddingBottom: 3,
            paddingLeft: 8,
            paddingRight: 8,
            borderWidth: 1,
            borderColor: allDone ? '#166534' : '#3d1f5c',
          }}
        >
          <TextWidget
            text={`${purchasedCount}/${person.gifts.length}`}
            style={{ fontSize: 10, color: allDone ? '#4ade80' : '#c084fc', fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Gift items */}
      {person.gifts.length === 0 ? (
        <FlexWidget
          style={{
            paddingTop: 6,
            paddingBottom: 6,
            paddingLeft: 36,
            backgroundColor: '#0f0810',
            borderBottomWidth: 1,
            borderColor: '#16102a',
          }}
        >
          <TextWidget
            text="No gift ideas yet"
            style={{ fontSize: 11, color: '#2e1f40', fontStyle: 'italic' }}
          />
        </FlexWidget>
      ) : null}
      {person.gifts.map((gift, i) => (
        <GiftRow key={i} gift={gift} personId={person.id} />
      ))}
    </FlexWidget>
  );
}

export function GiftsWidget({ peopleCount, totalGifts, purchasedCount, people = [] }: GiftsWidgetProps) {
  const remaining = totalGifts - purchasedCount;
  const pct = totalGifts > 0 ? Math.round((purchasedCount / totalGifts) * 100) : 0;
  const allDone = totalGifts > 0 && remaining === 0;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#0f0810',
        borderRadius: 20,
      }}
    >
      {/* ── Header ── */}
      <FlexWidget
        clickAction="android.intent.action.VIEW"
        clickActionData={{ uri: 'rork-app:///gifts' }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          paddingTop: 14,
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text="g i f t   v a u l t"
            style={{ fontSize: 8, color: '#c084fc', fontWeight: 'bold' }}
          />
          <TextWidget
            text="🎁 GIFTS"
            style={{ fontSize: 20, color: '#ffffff', fontWeight: 'bold', marginTop: 1 }}
          />
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text={`${purchasedCount}/${totalGifts}`}
            style={{ fontSize: 14, color: allDone ? '#4ade80' : '#c084fc', fontWeight: 'bold' }}
          />
          <TextWidget
            text={`  ${pct}%`}
            style={{ fontSize: 10, color: allDone ? '#4ade80' : '#7c3aed' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* ── Progress bar ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 10,
          alignItems: 'center',
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            height: 5,
            borderRadius: 3,
            flexDirection: 'row',
            backgroundColor: '#1e1028',
          }}
        >
          {pct > 0 ? (
            <FlexWidget
              style={{
                flex: Math.max(1, pct),
                height: 5,
                borderRadius: 3,
                backgroundColor: allDone ? '#4ade80' : '#a855f7',
              }}
            />
          ) : null}
          {pct < 100 ? (
            <FlexWidget style={{ flex: Math.max(1, 100 - pct), height: 5 }} />
          ) : null}
        </FlexWidget>
      </FlexWidget>

      {/* ── Divider ── */}
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#1e1028' }} />

      {/* ── Scrollable people/gifts list ── */}
      {people.length === 0 ? (
        <FlexWidget
          style={{
            width: 'match_parent',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text="No people added yet"
            style={{ fontSize: 11, color: '#2e1f40', fontStyle: 'italic' }}
          />
        </FlexWidget>
      ) : (
        <ListWidget
          style={{
            width: 'match_parent',
            flex: 1,
            backgroundColor: '#0f0810',
          }}
        >
          {people.map((person, i) => (
            <PersonSection key={i} person={person} />
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}
