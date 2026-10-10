// Tiny external store for the cart, backed by localStorage.
// Read through useSyncExternalStore so:
//  - the server render and first client render both see an empty cart
//    (no hydration mismatch), then the saved cart appears;
//  - no setState-inside-useEffect, and no race where an empty cart
//    overwrites the saved one on first load;
//  - every tab stays in sync (the "storage" event).
const KEY = 'addis_eats_cart';
const EMPTY = [];
const listeners = new Set();

let cachedRaw = null;
let cachedCart = EMPTY;

function read() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedCart; // same snapshot → same array reference
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : EMPTY;
    cachedCart = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cachedCart = EMPTY;
  }
  return cachedCart;
}

function write(cart) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    // storage full / blocked — cart still lives for this render cycle
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => e.key === KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export const getSnapshot = read;
export const getServerSnapshot = () => EMPTY;

export function updateCart(updater) {
  write(updater(read()));
}
