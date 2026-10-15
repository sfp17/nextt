import FilterShell from './FilterShell';
import { baseOpenGraph } from '@/lib/site';
import { queryDishes, dishesPageKey } from '@/lib/dishes';

export const metadata = {
  title: 'Menu',
  description:
    'The full Addis Eats menu: Ethiopian stews and platters, burgers, pizza, fries, smoothies and cold drinks, with prices in ETB. Search, filter by category and order in minutes.',
  alternates: { canonical: '/menu' },
  openGraph: { ...baseOpenGraph, url: '/menu' },
};

// ISR: the server-rendered first page is rebuilt at most once an hour.
export const revalidate = 3600;

export default async function MenuPage() {
  // Seed the first page on the server under the exact key the client will
  // request, so the menu is visible on first paint with no loading state.
  const firstPage = queryDishes({ page: 1, category: 'all' });

  return (
    <div>
      <div className="page-head">
        <h1>Menu</h1>
        <p>Everything we cook, with prices in birr. Filter by type or search by name.</p>
      </div>
      {/* Dish names are <h3>s (they sit under "Today's specials" on the home page);
          this keeps the outline h1 → h2 → h3 here too, for screen-reader heading navigation. */}
      <h2 className="visually-hidden">Dishes</h2>
      <FilterShell fallback={{ [dishesPageKey({ page: 1, category: 'all' })]: firstPage }} />
    </div>
  );
}
