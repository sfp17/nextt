import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// Who am I? Used by the header so pages like /menu can stay static (ISR)
// instead of every page reading cookies on the server.
export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { user: session ? { name: session.user.name, role: session.user.role } : null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
