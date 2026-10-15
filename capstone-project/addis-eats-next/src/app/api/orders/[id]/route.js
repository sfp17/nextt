import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getOrderForOwner } from '@/lib/orders';

export const dynamic = 'force-dynamic';

// Not covered by the proxy matcher (APIs should answer 401, not redirect
// to an HTML sign-in page) — so this handler checks the session itself.
export async function GET(request, { params }) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const order = await getOrderForOwner(id, session.user.id);
  if (!order) {
    return NextResponse.json({ error: `Order ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(order, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
