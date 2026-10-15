import 'server-only';
import { scrypt as scryptCb, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { store } from './store';

// Users: three demo accounts in code, plus every account created at /signup,
// which lives in the shared store (memory locally, Redis when deployed):
//   user:id:<id>        { id, name, email, role, passwordHash, createdAt }
//   user:email:<email>  "<id>"   ← claimed atomically, so an email can only be taken once
// Passwords are stored ONLY as salted scrypt hashes, never in plain text.

const scrypt = promisify(scryptCb);
const KEY_LEN = 64;

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = (await scrypt(password, salt, KEY_LEN)).toString('hex');
  return `${salt}:${hash}`;
}
const hashPasswordSync = (password, salt = randomBytes(16).toString('hex')) =>
  `${salt}:${scryptSync(password, salt, KEY_LEN).toString('hex')}`;

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = await scrypt(password, salt, KEY_LEN);
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

const SEED = [
  { id: 'usr_abebe', name: 'Abebe Bikila', email: 'abebe@addiseats.et', role: 'customer', password: 'injera123' },
  { id: 'usr_sara', name: 'Sara Tesfaye', email: 'sara@addiseats.et', role: 'customer', password: 'buna1234' },
  { id: 'usr_kitchen', name: 'Head Chef', email: 'kitchen@addiseats.et', role: 'staff', password: 'berbere99' },
];
const seedUsers =
  globalThis.__addisEatsUsers ??
  (globalThis.__addisEatsUsers = SEED.map(({ password, ...u }) => ({ ...u, passwordHash: hashPasswordSync(password) })));

// A real hash of a random password, checked when the email doesn't exist, so a
// wrong email takes as long as a wrong password (no "which emails exist" timing leak).
const DUMMY_HASH = hashPasswordSync(randomBytes(12).toString('hex'));

export const normaliseEmail = (email) => String(email ?? '').trim().toLowerCase();
const idKey = (id) => `user:id:${id}`;
const emailKey = (email) => `user:email:${email}`;

async function findByEmail(email) {
  const e = normaliseEmail(email);
  const seeded = seedUsers.find((u) => u.email === e);
  if (seeded) return seeded;
  const id = await store.get(emailKey(e));
  return id ? store.get(idKey(id)) : null;
}

/** Returns the public user (no hash) or null. */
export async function authenticate(email, password) {
  const user = await findByEmail(email);
  const ok = await verifyPassword(String(password), user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) return null;
  return toPublic(user);
}

export async function getUserById(id) {
  const seeded = seedUsers.find((u) => u.id === id);
  if (seeded) return toPublic(seeded);
  const user = await store.get(idKey(id));
  return user ? toPublic(user) : null;
}

/**
 * Create a customer account. New accounts are ALWAYS customers: the role is
 * never read from the form, so nobody can sign themselves up as staff.
 * Returns { user } or { error: 'email-taken' }.
 */
export async function createUser({ name, email, password }) {
  const e = normaliseEmail(email);
  if (seedUsers.some((u) => u.email === e)) return { error: 'email-taken' };

  const id = `usr_${randomBytes(9).toString('base64url')}`;
  // Claim the email first, atomically (Redis SET NX): two sign-ups with the same
  // email at the same moment, even on two servers, can't both succeed.
  const claimed = await store.setIfAbsent(emailKey(e), id);
  if (!claimed) return { error: 'email-taken' };

  const user = {
    id,
    name: String(name).trim(),
    email: e,
    role: 'customer',
    passwordHash: await hashPassword(String(password)),
    createdAt: Date.now(),
  };
  await store.set(idKey(id), user);
  return { user: toPublic(user) };
}

function toPublic({ passwordHash: _hash, ...user }) {
  return user;
}
