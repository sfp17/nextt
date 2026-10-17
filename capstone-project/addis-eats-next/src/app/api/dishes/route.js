import { NextResponse } from 'next/server';
import { PAGE_SIZE } from '@/lib/dishes';
import { queryDishes } from '@/lib/menu';

// GET /api/dishes?q=doro&category=ethiopian&page=2&limit=6
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? 'all';
  const page = Number(searchParams.get('page') ?? 1) || 1;
  const limit = Math.min(Number(searchParams.get('limit') ?? PAGE_SIZE) || PAGE_SIZE, 50);

  // Artificial latency so you can actually SEE flashing / race conditions
  // in the network tab. Shorter queries take longer on purpose: without
  // SWR's per-key cache, an old "d" response could land after "doro".
  const delay = q ? Math.max(150, 700 - q.length * 120) : 400;
  await new Promise((r) => setTimeout(r, delay));

  return NextResponse.json(await queryDishes({ q, category, page, limit }), { status: 200 });
}
