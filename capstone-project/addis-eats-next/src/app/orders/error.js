'use client'; // error boundaries must be client components

import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Shown when loading /orders throws. Force it with /orders?demo=error.
export default function OrdersError({ error, retry }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error); // where a real app would report it
  }, [error]);

  return (
    <div className="narrow">
      <div className="card empty-state" role="alert">
        <h1 style={{ fontSize: '1.9rem' }}>We couldn&apos;t load your orders</h1>
        <p>Your orders are safe; this page just failed to load them. Try again in a moment.</p>
        <div className="state-actions">
          <button type="button" className="btn btn-primary" onClick={() => retry()}>Try again</button>
          {/* Drop ?demo=error from the URL, then re-render the segment without it. */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              startTransition(() => {
                router.replace('/orders');
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
