import 'server-only';

/**
 * Tiny key-value store used for sessions and orders.
 *
 * - Locally (no env vars): an in-memory Map. Zero setup, restarting the server
 *   clears it.
 * - Deployed: Redis over Upstash's REST API. On Vercel every request can land on a
 *   different server instance, so memory is NOT shared: a session created on one
 *   instance would be "missing" on the next request. Redis gives every instance
 *   the same data. Add it in Vercel → Storage → Upstash Redis (free tier); the
 *   integration sets the env vars below automatically.
 *
 * Only six commands are used, so this needs no SDK: GET, MGET, SET (with
 * expiry, and NX for the order idempotency claim), DEL, LPUSH and LRANGE.
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const STORE_KIND = REDIS_URL && REDIS_TOKEN ? 'redis' : 'memory';

if (STORE_KIND === 'memory' && process.env.VERCEL && !globalThis.__addisEatsStoreWarned) {
  globalThis.__addisEatsStoreWarned = true;
  console.warn(
    '[addis-eats] Running on Vercel with the in-memory store. Sessions and orders will not be shared ' +
      'between server instances: add Upstash Redis (see README → Deploy).'
  );
}

// ---------------------------------------------------------------- redis
async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    throw new Error(`Redis ${command[0]} failed: ${body.error ?? res.status}`);
  }
  return body.result;
}

const redisStore = {
  async get(key) {
    const raw = await redis(['GET', key]);
    return raw == null ? null : JSON.parse(raw);
  },
  async mget(keys) {
    if (keys.length === 0) return [];
    const raws = await redis(['MGET', ...keys]); // one round-trip for many keys
    return raws.map((raw) => (raw == null ? null : JSON.parse(raw)));
  },
  async set(key, value, { ttlSeconds } = {}) {
    const cmd = ['SET', key, JSON.stringify(value)];
    if (ttlSeconds) cmd.push('EX', String(ttlSeconds));
    await redis(cmd);
  },
  /** Atomic "claim": true if this call created the key, false if it already existed (SET … NX). */
  async setIfAbsent(key, value, { ttlSeconds } = {}) {
    const cmd = ['SET', key, JSON.stringify(value), 'NX'];
    if (ttlSeconds) cmd.push('EX', String(ttlSeconds));
    return (await redis(cmd)) === 'OK'; // Redis answers null when the key was already there
  },
  async del(key) {
    await redis(['DEL', key]);
  },
  async lpush(key, value) {
    await redis(['LPUSH', key, value]);
  },
  async lrange(key) {
    return (await redis(['LRANGE', key, '0', '-1'])) ?? [];
  },
};

// ---------------------------------------------------------------- memory
const mem = globalThis.__addisEatsStore ?? (globalThis.__addisEatsStore = { kv: new Map(), lists: new Map() });

const memoryStore = {
  async get(key) {
    const hit = mem.kv.get(key);
    if (!hit) return null;
    if (hit.expiresAt && hit.expiresAt < Date.now()) {
      mem.kv.delete(key);
      return null;
    }
    return structuredClone(hit.value); // same "copy, not reference" behaviour as Redis
  },
  async mget(keys) {
    return Promise.all(keys.map((k) => memoryStore.get(k)));
  },
  async set(key, value, { ttlSeconds } = {}) {
    mem.kv.set(key, { value: structuredClone(value), expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
  },
  async setIfAbsent(key, value, opts) {
    // Check and set with NO await in between, so two calls can't both see "absent".
    const hit = mem.kv.get(key);
    if (hit && !(hit.expiresAt && hit.expiresAt < Date.now())) return false;
    mem.kv.set(key, { value: structuredClone(value), expiresAt: opts?.ttlSeconds ? Date.now() + opts.ttlSeconds * 1000 : null });
    return true;
  },
  async del(key) {
    mem.kv.delete(key);
  },
  async lpush(key, value) {
    const list = mem.lists.get(key) ?? [];
    list.unshift(value);
    mem.lists.set(key, list);
  },
  async lrange(key) {
    return [...(mem.lists.get(key) ?? [])];
  },
};

export const store = STORE_KIND === 'redis' ? redisStore : memoryStore;
