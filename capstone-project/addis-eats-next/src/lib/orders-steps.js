// Shared by the server (to compute status) and the client (to draw the
// progress list). No server-only code in here, so it is safe to import
// from a 'use client' component.
export const TIMELINE = [
  { status: 'placed', label: 'Order placed', after: 0 },
  { status: 'preparing', label: 'Kitchen is preparing', after: 15 },
  { status: 'on_the_way', label: 'Rider is on the way', after: 30 },
  { status: 'delivered', label: 'Delivered — enjoy!', after: 45 },
];

export const ORDER_STEPS = TIMELINE.map(({ status, label }) => ({ status, label }));
