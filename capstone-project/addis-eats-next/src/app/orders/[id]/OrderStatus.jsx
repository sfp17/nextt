'use client';

import { useState, useTransition } from 'react';
import useSWR from 'swr';
import { cancelOrder } from '@/app/actions';
import { fetcher } from '@/lib/fetcher';
import { ORDER_STEPS } from '@/lib/orders-steps';
import { etb } from '@/lib/format';

const POLL_MS = 5000;
const FINAL = ['delivered', 'cancelled'];

export default function OrderStatus({ id, initialOrder }) {
  const { data: order, error, isValidating, mutate } = useSWR(`/api/orders/${id}`, fetcher, {
    // Server-rendered order = first paint. SWR still revalidates after mount.
    fallbackData: initialOrder,
    // Poll every 5s while the order is live; stop once it is delivered or cancelled.
    refreshInterval: (latest) => (FINAL.includes(latest?.status) ? 0 : POLL_MS),
    // A user staring at a tracking screen expects it to be current the
    // moment they come back to the tab.
    revalidateOnFocus: true,
    // Don't poll from a background tab (wasted requests); the focus
    // revalidation above catches up the instant they switch back.
    refreshWhenHidden: false,
  });

  const [cancelError, setCancelError] = useState('');
  const [isCancelling, startCancel] = useTransition();

  const handleCancel = () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelError('');
    startCancel(async () => {
      const result = await cancelOrder(order.id);
      if (!result.success) setCancelError(result.error);
      await mutate(); // refetch now instead of waiting for the next 5s poll
    });
  };

  const isFinal = FINAL.includes(order.status);
  const currentIndex = ORDER_STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>Order</p>
          <strong style={{ fontSize: '1.15rem' }}>{order.id}</strong>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }} aria-live="polite">
          {isFinal ? (
            'Final status'
          ) : (
            <>
              <span className="live-dot" aria-hidden="true" />
              {isValidating ? 'Checking for updates…' : `Live, updates every ${POLL_MS / 1000} seconds`}
            </>
          )}
        </span>
      </div>

      <h2 style={{ marginBottom: '0.75rem' }}>{order.statusLabel}</h2>

      {order.status === 'cancelled' ? (
        <p style={{ marginBottom: '1.5rem', color: 'var(--ink-soft)' }}>
          This order was cancelled. Nothing will be charged or delivered.
        </p>
      ) : (
        <ol className="progress" aria-label="Order progress">
          {ORDER_STEPS.map((step, i) => {
            const done = i <= currentIndex;
            return (
              <li key={step.status} className={`${done ? 'done' : ''} ${i === currentIndex ? 'current' : ''}`} aria-current={i === currentIndex ? 'step' : undefined}>
                <span className="progress-dot" aria-hidden="true">{done ? '✓' : i + 1}</span>
                {step.label}
              </li>
            );
          })}
        </ol>
      )}

      {order.status === 'placed' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? 'Cancelling…' : 'Cancel order'}
          </button>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', marginTop: '0.4rem' }}>
            You can cancel until the kitchen starts preparing it.
          </p>
        </div>
      )}
      {cancelError && (
        <p role="alert" className="notice notice-error" style={{ marginBottom: '1rem' }}>{cancelError}</p>
      )}

      {error && (
        <p className="notice notice-error" style={{ marginBottom: '1rem' }}>
          Couldn&apos;t refresh the status ({error.status ?? 'network error'}). Showing the last known status and retrying automatically.
        </p>
      )}

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
        <ul style={{ listStyle: 'none' }}>
          {order.items.map((item) => (
            <li key={item.dishId} className="summary-row">
              <span>{item.name} × {item.quantity}</span>
              <span>{etb(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="summary-total">
          <span>Total</span>
          <span>{etb(order.total)}</span>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginTop: '0.9rem' }}>
          Delivering to {order.fullName}, {order.address}
        </p>
      </div>
    </div>
  );
}
