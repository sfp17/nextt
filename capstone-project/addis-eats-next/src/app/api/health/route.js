import { NextResponse } from 'next/server';
import { STORE_KIND } from '@/lib/store';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

// For the post-deployment check (scripts/postdeploy.mjs): is THIS deployment
// configured the way its environment needs? Names and kinds only, never values
// or secrets.
export function GET() {
  return NextResponse.json(
    {
      ok: true,
      environment: process.env.VERCEL_ENV ?? (process.env.NODE_ENV === 'production' ? 'local-production' : 'development'),
      store: STORE_KIND, // must be "redis" on Vercel (AUTH.md → "Why Redis")
      siteUrl: SITE_URL,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      analytics: Boolean(process.env.NEXT_PUBLIC_GA_ID),
      chatWidget: Boolean(process.env.NEXT_PUBLIC_CHAT_WIDGET_SRC),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
