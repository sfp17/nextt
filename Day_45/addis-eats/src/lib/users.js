import 'server-only';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

// In-memory user "table". Passwords are stored ONLY as salted scrypt hashes —
// the plain text below is hashed once at startup and never kept.
function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const SEED = [
  { id: 'usr_abebe', name: 'Abebe Bikila', email: 'abebe@addiseats.et', role: 'customer', password: 'injera123' },
  { id: 'usr_sara', name: 'Sara Tesfaye', email: 'sara@addiseats.et', role: 'customer', password: 'buna1234' },
  { id: 'usr_kitchen', name: 'Head Chef', email: 'kitchen@addiseats.et', role: 'staff', password: 'berbere99' },
];

const users =
  globalThis.__addisEatsUsers ??
  (globalThis.__addisEatsUsers = SEED.map(({ password, ...u }) => ({ ...u, passwordHash: hashPassword(password) })));

// A real hash of a random password, used when the email doesn't exist so a
// wrong email takes as long as a wrong password (no "which emails exist" timing leak).
const DUMMY_HASH = hashPassword(randomBytes(12).toString('hex'));

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = scryptSync(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

/** Returns the public user (no hash) or null. */
export function authenticate(email, password) {
  const user = users.find((u) => u.email === String(email).trim().toLowerCase());
  const ok = verifyPassword(String(password), user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) return null;
  return toPublic(user);
}

export function getUserById(id) {
  const user = users.find((u) => u.id === id);
  return user ? toPublic(user) : null;
}

function toPublic({ passwordHash: _hash, ...user }) {
  return user;
}
