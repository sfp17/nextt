import 'server-only';
import { headers } from 'next/headers';
import { store } from './store';

/**
 * A fixed-window rate limit kept in the shared store, so every server instance
 * counts together. Used for sign-in failures and sign-ups.
 *
 *   const limit = await rateLimit(`signin:${email}`, { max: 8, windowSeconds: 900 });
 *   if (!limit.ok) → "Too many attempts. Try again in N minutes."
 *
 * Counting with get + set isn't perfectly atomic, so two requests in the same
 * millisecond might both count as one. That's fine here: the goal is to stop
 * thousands of password guesses, not to count exactly.
 */
export async function rateLimit(name, { max, windowSeconds }) {
  const key = `rl:${name}`;
  const now = Date.now();
  const entry = (await store.get(key)) ?? { count: 0, resetAt: now + windowSeconds * 1000 };
  if (entry.resetAt <= now) Object.assign(entry, { count: 0, resetAt: now + windowSeconds * 1000 });
  const retryMinutes = Math.max(1, Math.ceil((entry.resetAt - now) / 60000));
  return {
    ok: entry.count < max,
    retryMinutes,
    /** Count this attempt. */
    async hit() {
      entry.count += 1;
      await store.set(key, entry, { ttlSeconds: Math.ceil((entry.resetAt - Date.now()) / 1000) + 1 });
    },
    /** Forget earlier failures (after a successful sign-in). */
    async reset() {
      await store.del(key);
    },
  };
}

/** The caller's IP address (first entry of X-Forwarded-For on Vercel). */
export async function clientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || 'local';
}
