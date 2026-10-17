import 'server-only';
import { cache } from 'react';
import { dishes as SEED_DISHES, PAGE_SIZE } from './dishes';
import { store } from './store';

// The menu the site actually serves.
//
// lib/dishes.js is the STARTING menu (in code). The first time an admin changes
// anything at /admin/menu, the whole menu is saved to the shared store under
// one key, and from then on that saved copy is used everywhere: the menu page,
// dish pages, search, the sitemap, link previews and checkout prices.
//   menu:dishes   [ { id, name, price, category, desc, image, imageAlt, updatedAt, available } ]
// One key = one read per request, and an edit can never leave the menu half-saved.

const KEY = 'menu:dishes';

export const CATEGORIES = ['ethiopian', 'burgers', 'pizza', 'sides', 'drinks'];

/** The photos admins can choose from: every photo in the starting menu. */
export const PHOTO_LIBRARY = [...new Map(SEED_DISHES.map((d) => [d.image, d])).values()].map((d) => ({
  src: d.image,
  label: `${d.name} photo`,
  alt: d.imageAlt,
}));

// Read once per request (React cache), not once per call.
const loadAll = cache(async () => {
  const saved = await store.get(KEY);
  return (saved ?? SEED_DISHES).map((d) => ({ available: true, ...d }));
});

/** Every dish. Hidden (unavailable) dishes only when asked for, e.g. by the admin. */
export async function getMenu({ includeHidden = false } = {}) {
  const all = await loadAll();
  return includeHidden ? all : all.filter((d) => d.available !== false);
}

export async function getDish(id, { includeHidden = false } = {}) {
  const dish = (await loadAll()).find((d) => d.id === String(id)) ?? null;
  if (!dish) return null;
  return includeHidden || dish.available !== false ? dish : null;
}

/** Search + filter + page (same result shape as before; now async). */
export async function queryDishes({ q = '', category = 'all', page = 1, limit = PAGE_SIZE } = {}) {
  const term = q.trim().toLowerCase();
  const cat = category.toLowerCase();
  const matches = (await getMenu()).filter(
    (d) => (!term || d.name.toLowerCase().includes(term)) && (cat === 'all' || d.category === cat)
  );
  const total = matches.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return {
    items: matches.slice(start, start + limit),
    page: safePage,
    limit,
    total,
    totalPages,
    hasMore: safePage < totalPages,
  };
}

// ---------------------------------------------------------------- admin writes
// Callers (server actions in app/admin) check the admin role first.

async function saveAll(list) {
  await store.set(KEY, list);
}

const today = () => new Date().toISOString().slice(0, 10);

export async function createDish(data) {
  const list = await loadAll();
  const nextId = String(Math.max(0, ...list.map((d) => Number(d.id) || 0)) + 1);
  const dish = { id: nextId, ...data, updatedAt: today() };
  await saveAll([...list, dish]);
  return dish;
}

export async function updateDish(id, data) {
  const list = await loadAll();
  if (!list.some((d) => d.id === id)) return null;
  const next = list.map((d) => (d.id === id ? { ...d, ...data, id, updatedAt: today() } : d));
  await saveAll(next);
  return next.find((d) => d.id === id);
}

export async function deleteDish(id) {
  const list = await loadAll();
  if (!list.some((d) => d.id === id)) return false;
  await saveAll(list.filter((d) => d.id !== id));
  return true;
}

/** Back to lib/dishes.js (handy before a demo). */
export async function resetMenu() {
  await store.del(KEY);
}
