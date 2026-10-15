'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { dishesPageKey } from '@/lib/dishes';
import DishList from './DishList';

/**
 * Paged dish list. The page number lives in the query string of the SWR key
 * (/api/dishes?page=2&limit=6&category=all), so every page is its own cache
 * entry: going back to page 1 is instant.
 */
export default function PagedDishes({ category = 'all' }) {
  const [pageState, setPageState] = useState({ category, page: 1 });
  // Changing category resets to page 1 (derived during render, no effect).
  const page = pageState.category === category ? pageState.page : 1;
  const setPage = (p) => setPageState({ category, page: p });

  const { data, error, isLoading, isValidating } = useSWR(
    dishesPageKey({ page, category }),
    fetcher,
    {
      // Page 2 keeps showing page 1's dishes until it arrives — no empty flash.
      keepPreviousData: true,
      // The menu changes when the kitchen edits it, not every few seconds.
      dedupingInterval: 5 * 60_000,
      revalidateOnFocus: false,
    }
  );

  if (error) return <p className="notice notice-error">The menu didn&apos;t load. Check your connection and refresh the page.</p>;
  if (isLoading && !data) return <p style={{ color: 'var(--text-muted)' }}>Loading dishes…</p>;

  const loadingNext = isValidating && data?.page !== page;

  return (
    <div>
      <div style={{ opacity: loadingNext ? 0.6 : 1, transition: 'opacity 0.15s' }}>
        <DishList dishes={data.items} preloadFirst={page === 1 && category.toLowerCase() === 'all'} />
      </div>

      {data.totalPages > 1 && (
        <nav className="pagination" aria-label="Pagination">
          <button type="button" className="btn btn-secondary" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
            Previous
          </button>
          <span className="pagination-status" aria-live="polite">
            {loadingNext ? 'Loading…' : `Page ${page} of ${data.totalPages}`}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage(page + 1)}
            disabled={!data.hasMore || page >= data.totalPages}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
