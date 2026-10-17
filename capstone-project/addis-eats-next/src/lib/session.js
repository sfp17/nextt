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

// Each user's open sessions (their hashed keys), so "Log out of all devices" and a
// password change can end every one of them, not just the one in this browser.
const userSessionsKey = (userId) => `sessions:user:${userId}`;

export async function createSession(userId) {
  const id = randomBytes(32).toString('base64url');
  await store.set(sessionKey(id), { userId, createdAt: Date.now() }, { ttlSeconds: MAX_AGE_SECONDS }); // expires server-side too
  await store.lpush(userSessionsKey(userId), sessionKey(id));
  (await cookies()).set(SESSION_COOKIE, id, await cookieOptions());
}

/** Log out: this browser only. The session is deleted on the server, so a copied cookie stops working too. */
export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    const record = await store.get(sessionKey(id));
    await store.del(sessionKey(id));
    if (record?.userId) await store.lrem(userSessionsKey(record.userId), sessionKey(id));
  }
  jar.delete(SESSION_COOKIE);
}

/**
 * End every session of a user (all browsers, phones, laptops). With
 * `keepCurrent`, the browser making the request stays signed in (used after a
 * password change: you stay in, everyone else using the old password is out).
 */
export async function destroyAllSessions(userId, { keepCurrent = false } = {}) {
  const currentId = (await cookies()).get(SESSION_COOKIE)?.value;
  const current = currentId ? sessionKey(currentId) : null;
  const keys = [...new Set(await store.lrange(userSessionsKey(userId)))];
  let ended = 0;
  for (const key of keys) {
    if (keepCurrent && key === current) continue;
    await store.del(key);
    await store.lrem(userSessionsKey(userId), key);
    ended++;
  }
  // Only clear THIS browser's cookie if it belonged to that user (an admin
  // ending a customer's sessions stays signed in themselves).
  if (!keepCurrent && current && keys.includes(current)) (await cookies()).delete(SESSION_COOKIE);
  return ended;
}

/** How many sessions this user has open right now (expired ones are tidied up as we go). */
export async function countSessions(userId) {
  const keys = [...new Set(await store.lrange(userSessionsKey(userId)))];
  const alive = await store.mget(keys);
  let n = 0;
  for (let i = 0; i < keys.length; i++) {
    if (alive[i]) n++;
    else await store.lrem(userSessionsKey(userId), keys[i]);
  }
  return n;
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

  const user = await getUserById(record.userId);
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
