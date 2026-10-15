import { TIMELINE } from './orders-steps';

// Where things are on the map, and where the courier is right now.
//
// There is no real courier app behind Addis Eats, so the position is derived
// from the order's timeline (orders-steps.js), the same way the status is:
//   placed / preparing → courier waiting at the kitchen
//   on the way         → moving from the kitchen to the address
//   delivered          → at the address
// Pure functions, no server-only imports: the server builds the snapshot, and
// the client only ever receives the finished snapshot.

/** The Addis Eats kitchen, near Meskel Square. [lat, lng] */
export const KITCHEN = { lat: 9.0107, lng: 38.7613, label: 'Addis Eats kitchen, Meskel Square' };

// Approximate centre of each delivery area.
export const AREA_CENTRES = {
  Bole: { lat: 8.9965, lng: 38.7867 },
  Kazanchis: { lat: 9.0172, lng: 38.7665 },
  Megenagna: { lat: 9.0203, lng: 38.8019 },
  CMC: { lat: 9.0215, lng: 38.8436 },
  Sarbet: { lat: 8.9979, lng: 38.7364 },
  Piassa: { lat: 9.0349, lng: 38.7523 },
  Mexico: { lat: 9.0098, lng: 38.7453 },
  Lideta: { lat: 9.0128, lng: 38.7339 },
};

const STEP = Object.fromEntries(TIMELINE.map((s) => [s.status, s.after]));
const RIDE_START = STEP.on_the_way; // seconds after the order
const RIDE_END = STEP.delivered;

// Small deterministic hash so every order gets its own spot in its area,
// and the same spot on every request and every server.
function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** The delivery point: the area's centre, nudged up to ~450 m by the order id. */
export function destinationFor(order) {
  const centre = AREA_CENTRES[order.neighbourhood] ?? AREA_CENTRES.Bole;
  const h = hash(order.id);
  return {
    lat: centre.lat + (((h & 0xffff) / 0xffff) - 0.5) * 0.008,
    lng: centre.lng + ((((h >>> 16) & 0xffff) / 0xffff) - 0.5) * 0.008,
  };
}

/** Great-circle distance in km. */
export function distanceKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function nearestArea(point) {
  let best = null;
  for (const [name, c] of Object.entries(AREA_CENTRES)) {
    const d = distanceKm(point, c);
    if (!best || d < best.d) best = { name, d };
  }
  return best.name;
}

const round = (n) => Math.round(n * 1e5) / 1e5; // ~1 m: plenty, and keeps events small

/**
 * Everything the tracking page shows, as plain JSON. This exact object is
 * rendered by the server (first paint) and then sent by the stream on every change.
 */
export function trackingSnapshot(order, now = Date.now()) {
  const destination = destinationFor(order);
  const final = order.status === 'delivered' || order.status === 'cancelled';
  const elapsed = (now - order.createdAt) / 1000;

  let progress; // 0 = at the kitchen, 1 = at the door
  if (order.status === 'delivered') progress = 1;
  else if (order.status === 'on_the_way') progress = Math.min(1, Math.max(0, (elapsed - RIDE_START) / (RIDE_END - RIDE_START)));
  else progress = 0;

  const courier = {
    lat: round(KITCHEN.lat + (destination.lat - KITCHEN.lat) * progress),
    lng: round(KITCHEN.lng + (destination.lng - KITCHEN.lng) * progress),
  };

  let courierText;
  if (order.status === 'cancelled') courierText = 'No courier: the order was cancelled.';
  else if (order.status === 'delivered') courierText = `Delivered to the address in ${order.neighbourhood ?? 'Addis Ababa'}.`;
  else if (progress === 0) courierText = `Waiting at the ${KITCHEN.label} for your food.`;
  else courierText = `On the way, near ${nearestArea(courier)}.`;

  return {
    id: order.id,
    status: order.status,
    statusLabel: order.statusLabel,
    final,
    courier,
    courierText,
    destination: { lat: round(destination.lat), lng: round(destination.lng) },
    neighbourhood: order.neighbourhood ?? null,
    address: order.address,
    remainingKm: Math.round(distanceKm(courier, destination) * 10) / 10,
    progress: Math.round(progress * 100) / 100,
    createdAt: order.createdAt,
    etaAt: final ? null : order.createdAt + RIDE_END * 1000,
    deliveredAt: order.status === 'delivered' ? (order.deliveredAt ?? order.createdAt + RIDE_END * 1000) : null,
    total: order.total,
    sentAt: now,
  };
}
