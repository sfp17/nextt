'use client';

import { useDeferredValue, useState } from 'react';
import { SWRConfig } from 'swr';
import CategoryBar from './CategoryBar';
import SearchBox from './SearchBox';
import PagedDishes from './PagedDishes';

/**
 * `fallback` is a map of { swrKey: data } rendered on the server.
 * Unlike per-hook `fallbackData`, it only applies to the EXACT key it was
 * seeded for — so page 1 paints instantly, and page 2 still fetches.
 */
export default function FilterShell({ fallback }) {
  const [category, setCategory] = useState('All');
  // The chip highlights immediately (urgent update); the grid re-renders with
  // the deferred value right after, without blocking the tap (better INP).
  const gridCategory = useDeferredValue(category);

  return (
    <SWRConfig value={{ fallback }}>
      <SearchBox category={gridCategory} filters={<CategoryBar selected={category} onSelect={setCategory} />}>
        <PagedDishes category={gridCategory} />
      </SearchBox>
    </SWRConfig>
  );
}
