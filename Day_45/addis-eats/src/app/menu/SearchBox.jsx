'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useDebounce } from '@/hooks/useDebounce';
import DishList from './DishList';

/**
 * Debounced, race-free search.
 *
 * - Debounce: the key only changes 300ms after the last keystroke.
 * - Null key: empty term → key is null → SWR makes NO request and we render
 *   `children` (the normal paged menu) instead of an empty search.
 * - No races: SWR caches per key and only ever returns data for the CURRENT
 *   key, so a slow response for "d" can never overwrite results for "doro".
 * - No flashing: keepPreviousData keeps showing the last results while the
 *   next term loads, instead of dropping to an empty/loading state.
 */
export default function SearchBox({ category = 'all', filters = null, children }) {
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term.trim(), 300);

  const key = debounced
    ? `/api/dishes?q=${encodeURIComponent(debounced)}&category=${encodeURIComponent(category.toLowerCase())}&page=1&limit=50`
    : null;

  const { data, error, isLoading, isValidating } = useSWR(key, fetcher, {
    keepPreviousData: true,
    // Search results for a given term don't change while you type —
    // re-typing "pizza" within 60s is served from cache with no request.
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });

  // Typed, but debounce hasn't fired yet, or a request is in flight.
  const pending = term.trim() !== debounced || (key && isValidating);

  return (
    <div>
      <div className="menu-toolbar">
        <div className="search" role="search">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <label htmlFor="dish-search" className="visually-hidden">Search dishes</label>
          <input
            id="dish-search"
            type="search"
            className="form-control"
            placeholder="Search dishes"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            autoComplete="off"
          />
          {term.trim() && (
            <span className="search-status" aria-live="polite">
              {pending ? 'Searching…' : `${data?.total ?? 0} found`}
            </span>
          )}
        </div>
        {filters}
      </div>

      {/* Null key → no search running → show the normal paged menu.
          Kept mounted (just hidden) so its page number survives a search. */}
      <div hidden={!!key}>{children}</div>

      {key &&
        (error ? (
          <p className="notice notice-error">Search didn&apos;t load. Check your connection and try again.</p>
        ) : isLoading && !data ? (
          // Only on the very first search, when there is nothing previous to keep.
          <p style={{ color: 'var(--text-muted)' }}>Searching…</p>
        ) : data.items.length === 0 ? (
          <div className="card card-muted empty-state">
            <h3>No dishes match &ldquo;{debounced}&rdquo;</h3>
            <p>Try a shorter word, or clear the search to see the whole menu.</p>
            <button type="button" className="btn btn-secondary" onClick={() => setTerm('')}>Clear search</button>
          </div>
        ) : (
          <div style={{ opacity: pending ? 0.6 : 1, transition: 'opacity 0.15s' }}>
            <DishList dishes={data.items} />
          </div>
        ))}
    </div>
  );
}
