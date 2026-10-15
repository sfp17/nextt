import 'server-only';
import { dishes } from './dishes';
import { NEIGHBOURHOODS } from './neighbourhoods';

/**
 * 30 days of past orders, so the dashboard has something to show.
 *
 * Deterministic: the same seed always gives the same orders, so every server
 * instance (and every page load) agrees without storing anything. Dates are
 * relative to "today" in Addis Ababa, so the history always covers the last
 * 30 days. Nothing here is ever written to the store: these orders are all
 * finished (delivered or cancelled) and can't be changed.
 *
 * Abebe owns about a quarter of them (so his order table has several pages);
 * Sara owns none, so she sees the empty state a brand-new customer sees.
 */

export const HISTORY_DAYS = 30;
const ADDIS_OFFSET_MS = 3 * 60 * 60 * 1000; // Africa/Addis_Ababa is UTC+3 all year (no DST)

/** "2026-10-14": the calendar day in Addis Ababa for a timestamp. */
export function addisDayKey(ts) {
  return new Date(ts + ADDIS_OFFSET_MS).toISOString().slice(0, 10);
}

/** Midnight (Addis time) of the day containing `ts`, as a UTC timestamp. */
function addisMidnight(ts) {
  return Date.parse(`${addisDayKey(ts)}T00:00:00Z`) - ADDIS_OFFSET_MS;
}

// Small seeded PRNG (mulberry32): same numbers every run.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickWeighted = (rand, items, weights) => {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) if ((r -= weights[i]) < 0) return items[i];
  return items[items.length - 1];
};

// Bole and Kazanchis order most; Lideta least.
const AREA_WEIGHTS = [22, 14, 13, 11, 10, 10, 9, 7];

const CUSTOMERS = [
  { id: 'usr_abebe', name: 'Abebe Bikila', weight: 25 },
  { id: 'usr_c01', name: 'Hanna Girma', weight: 12 },
  { id: 'usr_c02', name: 'Dawit Mekonnen', weight: 11 },
  { id: 'usr_c03', name: 'Meron Tadesse', weight: 10 },
  { id: 'usr_c04', name: 'Yonas Alemu', weight: 10 },
  { id: 'usr_c05', name: 'Selam Bekele', weight: 9 },
  { id: 'usr_c06', name: 'Kidist Haile', weight: 8 },
  { id: 'usr_c07', name: 'Bereket Assefa', weight: 8 },
  { id: 'usr_c08', name: 'Tsion Wolde', weight: 7 },
];

function generate(todayMidnight) {
  const orders = [];
  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const rand = rng(4500 + daysAgo); // one seed per "days ago" slot
    const dayStart = todayMidnight - daysAgo * 86400000;
    const weekday = new Date(dayStart + ADDIS_OFFSET_MS).getUTCDay(); // 5 = Fri, 6 = Sat
    const count = 5 + (weekday === 5 || weekday === 6 ? 3 : 0) + Math.floor(rand() * 5);

    for (let i = 0; i < count; i++) {
      const customer = pickWeighted(rand, CUSTOMERS, CUSTOMERS.map((c) => c.weight));
      const neighbourhood = pickWeighted(rand, NEIGHBOURHOODS, AREA_WEIGHTS);
      const lines = 1 + Math.floor(rand() * 3);
      const items = [];
      for (let l = 0; l < lines; l++) {
        const dish = dishes[Math.floor(rand() * dishes.length)];
        if (items.some((it) => it.dishId === dish.id)) continue;
        items.push({ dishId: dish.id, name: dish.name, price: dish.price, quantity: 1 + Math.floor(rand() * 2) });
      }
      // Between 10:00 and 22:00 local time
      const createdAt = dayStart + (10 * 60 + Math.floor(rand() * 12 * 60)) * 60000;
      const cancelled = rand() < 0.06;
      orders.push({
        id: `ORD-H${String(daysAgo).padStart(2, '0')}${String(i).padStart(2, '0')}`,
        ownerId: customer.id,
        fullName: customer.name,
        phone: `09${String(Math.floor(rand() * 1e8)).padStart(8, '0')}`,
        neighbourhood,
        address: `${neighbourhood}, house ${1 + Math.floor(rand() * 400)}`,
        items,
        createdAt,
        cancelledAt: cancelled ? createdAt + 5 * 60000 : null,
        deliveredAt: cancelled ? null : createdAt + 45 * 60000,
        history: true,
      });
    }
  }
  return orders;
}

let cache = { day: null, orders: [] };

/** All history orders that have already happened (none in the future). */
export function historyOrders(now = Date.now()) {
  const today = addisDayKey(now);
  if (cache.day !== today) cache = { day: today, orders: generate(addisMidnight(now)) };
  return cache.orders.filter((o) => o.createdAt <= now);
}

export const isHistoryId = (id) => /^ORD-H\d{4}$/.test(id);
