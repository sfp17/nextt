'use client'; // error boundaries must be client components

import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Shown when loading the dashboard throws. Force it with /dashboard?demo=error.
export default function DashboardError({ error, retry }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="narrow">
      <div className="card empty-state" role="alert">
        <h1 style={{ fontSize: '1.9rem' }}>The dashboard couldn&apos;t load</h1>
        <p>No orders were changed. The figures failed to load; try again in a moment.</p>
        <div className="state-actions">
          <button type="button" className="btn btn-primary" onClick={() => retry()}>Try again</button>
          {/* Drop ?demo=error from the URL, then re-render the segment without it. */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              startTransition(() => {
                router.replace('/dashboard');
                retry();
              })
            }
          >
            Reload without the forced error
          </button>
        </div>
      </div>
    </div>
  );
}
