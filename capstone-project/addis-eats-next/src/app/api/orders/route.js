import { NextResponse } from 'next/server';
import { orderSchema } from '@/lib/schema';
import { placeOrderOnce } from '@/lib/orders';
import { getSession } from '@/lib/session';

// POST /api/orders — JSON API for placing an order (the checkout page uses
// the placeOrder server action; this is for other clients, e.g. a mobile app).
// Moved here from /api/dishes/orders: orders are not a sub-resource of dishes.
export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const result = orderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Unprocessable Entity', fieldErrors: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Owner always comes from the session, never from the request body.
  // Optional Idempotency-Key header (the same idea as the checkout form's hidden key):
  // retrying a request with the same key returns the first order instead of a second one.
  const { order, duplicate } = await placeOrderOnce({
    ...result.data,
    ownerId: session.user.id,
    idempotencyKey: request.headers.get('idempotency-key')?.slice(0, 64) ?? null,
  });
  if (!order) return NextResponse.json({ error: 'Order still being placed, retry shortly' }, { status: 409 });

  return NextResponse.json(
    { message: 'Order submitted', order: { id: order.id, status: 'placed' } },
    { status: duplicate ? 200 : 201, headers: { Location: `/api/orders/${order.id}` } }
  );
}
