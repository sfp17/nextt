import { NextResponse } from 'next/server';
import { getDish } from '@/lib/dishes';

export async function GET(request, { params }) {
  // Next.js 15+: params is a Promise and must be awaited.
  const { id } = await params;
  const dish = getDish(id);

  if (!dish) {
    return NextResponse.json(
      { error: `Dish with ID ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(dish, { status: 200 });
}
