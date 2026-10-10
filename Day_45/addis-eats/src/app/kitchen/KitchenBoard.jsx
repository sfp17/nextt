'use client';

import { useState, useTransition } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { markOrderDelivered } from '@/app/actions';

export default function KitchenBoard({ initialOrders }) {
  const { data: orders, error, mutate } = useSWR('/api/kitchen/orders', fetcher, {
    fallbackData: initialOrders,
    refreshInterval: 5000, // new orders show up without reloading
  });
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [, startTransition] = useTransition();

  const deliver = (id) => {
    setBusyId(id);
    setActionError('');
    startTransition(async () => {
      const res = await markOrderDelivered(id);
      if (!res.success) setActionError(res.error);
      await mutate();
      setBusyId(null);
    });
  };

  if (error) {
    return <p style={{ color: 'var(--primary)' }}>Lost access to the kitchen board ({error.status}). Please sign in again.</p>;
  }

  return (
    <>
      {actionError && <p role="alert" className="notice notice-error" style={{ marginBottom: '1rem' }}>{actionError}</p>}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="kitchen-table">
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.id}</strong></td>
                <td>{o.fullName}<br /><small style={{ color: 'var(--ink-faint)' }}>{o.phone}</small></td>
                <td>{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</td>
                <td>{o.total} ETB</td>
                <td><span className={`status-pill ${o.status}`}>{o.statusLabel}</span></td>
                <td>
                  {!['delivered', 'cancelled'].includes(o.status) && (
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }} disabled={busyId === o.id} onClick={() => deliver(o.id)}>
                      {busyId === o.id ? 'Saving…' : 'Mark delivered'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
