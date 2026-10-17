import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { isStaff } from '@/lib/roles';
import { listLiveOrders } from '@/lib/orders';

export const dynamic = 'force-dynamic';

// Every customer's orders — so the role check must live here too.
// Securing only the /kitchen page would leave this URL wide open.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!isStaff(session.user.role)) return NextResponse.json({ error: 'Staff only' }, { status: 403 });

  return NextResponse.json(await listLiveOrders(), { headers: { 'Cache-Control': 'no-store' } });
}
