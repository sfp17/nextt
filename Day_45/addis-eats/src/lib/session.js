import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes, createHash } from 'node:crypto';
import { getUserById } from './users';
import { store } from './store';

export const SESSION_COOKIE = 'ae_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Server-side sessions: the cookie holds only a random, unguessable 256-bit id.
// The store (memory locally, Redis when deployed) keeps { userId } under a
// SHA-256 HASH of that id, so even someone who could read the store couldn't
// use what's in it as a cookie. Deleting the entry = real sign-out: the cookie
// becomes worthless even if it was copied.
const sessionKey = (id) => `session:${createHash('sha256').update(id).digest('hex')}`;

// `secure` is ON everywhere except plain-http localhost, where browsers would
// silently drop a Secure cookie and you could never sign in (see AUTH.md).
async function isLocalhost() {
  const host = (await headers()).get('host') ?? '';
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}

export async function cookieOptions() {
  return {
    httpOnly: true, // page JavaScript can't read it → an XSS bug can't steal it
    secure: !(await isLocalhost()), // only ever sent over HTTPS in the real world
    sameSite: 'lax', // not sent on cross-site POSTs (blocks CSRF), still sent when following a link in
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function createSession(userId) {
  const id = randomBytes(32).toString('base64url');
  await store.set(sessionKey(id), { userId }, { ttlSeconds: MAX_AGE_SECONDS }); // expires server-side too
  (await cookies()).set(SESSION_COOKIE, id, await cookieOptions());
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) await store.del(sessionKey(id));
  jar.delete(SESSION_COOKIE);
}

/**
 * THE way every server surface (pages, server actions, route handlers)
 * finds out who is calling. Returns { user } or null.
 * The proxy only checks the cookie EXISTS; this checks it is VALID.
 */
export async function getSession() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const record = await store.get(sessionKey(id)); // null if unknown, signed out or expired
  if (!record) return null;

  const user = getUserById(record.userId);
  return user ? { user } : null;
}

/** For pages: signed-out users are sent to /signin and brought back after. */
export async function requireUser(returnTo) {
  const session = await getSession();
  if (!session) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  return session;
}

/**
 * Only allow same-site relative paths as a post-sign-in destination.
 * Blocks open redirects like ?next=https://evil.com, //evil.com and /\evil.com.
 */
export function safeNext(next) {
  if (typeof next !== 'string') return '/';
  if (!next.startsWith('/')) return '/';
  if (next.startsWith('//') || next.startsWith('/\\')) return '/';
  if (/[\u0000-\u001f]/.test(next)) return '/'; // control chars / newlines
  return next;
}
