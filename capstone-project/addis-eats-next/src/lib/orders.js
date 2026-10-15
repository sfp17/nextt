import 'server-only';
import { getDish } from './dishes';
import { TIMELINE } from './orders-steps';
import { store } from './store';
import { historyOrders, isHistoryId } from './orderHistory';

// Orders live in the shared store (memory locally, Redis when deployed):
//   order:<id>              the order record
//   orders:owner:<userId>   that customer's order ids, newest first
//   orders:all              every order id, newest first (kitchen board)
//
// Status is derived from elapsed time (see orders-steps.js) so the polling
// screen has something to watch change without a real kitchen behind it.

const orderKey = (id) => `order:${id}`;
const ownerKey = (userId) => `orders:owner:${userId}`;
const ALL_KEY = 'orders:all';

export async function createOrder({ fullName, phone, neighbourhood, address, items, ownerId = null }) {
  let id;
  do {
    id = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  } while (await store.get(orderKey(id))); // never overwrite an existing order

  const order = {
    id,
    ownerId,
    fullName,
    phone,
    neighbourhood,
    address,
    // Names and prices come from the menu on the server, never from the client.
    items: items.map((i) => {
      const dish = getDish(i.dishId);
      return {
        dishId: i.dishId,
        name: dish?.name ?? `Dish #${i.dishId}`,
        price: dish?.price ?? 0,
        quantity: i.quantity,
      };
    }),
    createdAt: Date.now(),
    cancelledAt: null,
    deliveredAt: null,
  };

  await store.set(orderKey(id), order);
  if (ownerId) await store.lpush(ownerKey(ownerId), id);
  await store.lpush(ALL_KEY, id);
  return order;
}

/**
 * Create an order at most once per idempotency key.
 *
 * The checkout page hands each form a fresh random key. A double tap, a
 * double-click, a retried request or a second tab sending the SAME form all
 * carry the same key, so only the first creates an order; the others get that
 * same order back. The claim is atomic (Redis SET NX), so two requests arriving
 * at the same moment on two different servers still can't both win.
 */
export async function placeOrderOnce({ idempotencyKey, ownerId, ...data }) {
  if (!idempotencyKey) return { order: await createOrder({ ...data, ownerId }), duplicate: false };

  const key = `idem:${ownerId}:${idempotencyKey}`; // scoped to the user: nobody can replay someone else's key
  const claimed = await store.setIfAbsent(key, { state: 'pending' }, { ttlSeconds: 600 });
  if (claimed) {
    try {
      const order = await createOrder({ ...data, ownerId });
      await store.set(key, { state: 'done', orderId: order.id }, { ttlSeconds: 24 * 3600 });
      return { order, duplicate: false };
    } catch (err) {
      await store.del(key); // let a retry try again
      throw err;
    }
  }

  // Someone else (the first tap) holds the claim: wait for its order, up to ~5 s.
  for (let i = 0; i < 25; i++) {
    const seen = await store.get(key);
    if (seen?.state === 'done') return { order: await getOrder(seen.orderId), duplicate: true };
    if (!seen) break; // the first attempt failed and released the key
    await new Promise((r) => setTimeout(r, 200));
  }
  return { order: null, duplicate: true };
}

// A demo order that always exists, so /orders/ORD-DEMO works right away for Abebe.
// It restarts 60s after delivery so you can watch the polling again.
async function ensureDemoOrder() {
  const demo = await store.get(orderKey('ORD-DEMO'));
  const finished = demo && (Date.now() - demo.createdAt) / 1000 > 45 + 60;
  if (demo && !finished) return;

  await store.set(orderKey('ORD-DEMO'), {
    id: 'ORD-DEMO',
    ownerId: 'usr_abebe',
    fullName: 'Abebe Bikila',
    phone: '0911223344',
    neighbourhood: 'Bole',
    address: 'Bole Medhanialem, Building A, House #204',
    items: [
      { dishId: '1', name: 'Doro Wat', price: 350, quantity: 1 },
      { dishId: '14', name: 'Iced Latte', price: 120, quantity: 1 },
    ],
    createdAt: Date.now(),
    cancelledAt: null,
    deliveredAt: null,
  });
  if (!demo) {
    // first time only: add it to the indexes
    await store.lpush(ownerKey('usr_abebe'), 'ORD-DEMO');
    await store.lpush(ALL_KEY, 'ORD-DEMO');
  }
}

function withStatus(order) {
  const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (order.cancelledAt) {
    return { ...order, status: 'cancelled', statusLabel: 'Order cancelled', total, updatedAt: new Date().toISOString() };
  }

  const elapsed = order.deliveredAt ? Infinity : (Date.now() - order.createdAt) / 1000;
  const current = [...TIMELINE].reverse().find((s) => elapsed >= s.after);

  return { ...order, status: current.status, statusLabel: current.label, total, updatedAt: new Date().toISOString() };
}

/** Internal: any order by id. Customer-facing code must use getOrderForOwner. */
export async function getOrder(id) {
  const key = String(id);
  if (isHistoryId(key)) {
    const past = historyOrders().find((o) => o.id === key);
    return past ? withStatus(past) : null;
  }
  await ensureDemoOrder();
  const order = await store.get(orderKey(key));
  return order ? withStatus(order) : null;
}

/**
 * The ONLY lookup customer-facing code uses. The owner is part of the query,
 * so another account's order is simply "not found": we don't even reveal
 * that it exists.
 */
export async function getOrderForOwner(id, ownerId) {
  const order = await getOrder(id);
  if (!order || order.ownerId !== ownerId) return null;
  return order;
}

async function loadMany(ids, extra = []) {
  const unique = [...new Set(ids)];
  const stored = await store.mget(unique.map(orderKey)); // one round-trip, not one per order
  return [...stored.filter(Boolean), ...extra].map(withStatus).sort((a, b) => b.createdAt - a.createdAt);
}

/** Only this customer's orders: the index itself is per-owner, and history is filtered by owner too. */
export async function listOrdersForOwner(ownerId) {
  await ensureDemoOrder();
  const past = historyOrders().filter((o) => o.ownerId === ownerId);
  return loadMany(await store.lrange(ownerKey(ownerId)), past);
}

/** Staff only: callers must check the role first. Every order, including history. */
export async function listAllOrders() {
  await ensureDemoOrder();
  return loadMany(await store.lrange(ALL_KEY), historyOrders());
}

/**
 * Staff only: orders placed through the app, for the kitchen board. The 30 days of
 * generated history (all finished long ago) belong on the dashboard, not here.
 */
export async function listLiveOrders() {
  await ensureDemoOrder();
  return loadMany(await store.lrange(ALL_KEY));
}

export async function markCancelled(id) {
  const order = await store.get(orderKey(id));
  if (order) await store.set(orderKey(id), { ...order, cancelledAt: Date.now() });
}

export async function markDelivered(id) {
  const order = await store.get(orderKey(id));
  if (order && !order.cancelledAt) await store.set(orderKey(id), { ...order, deliveredAt: Date.now() });
}
