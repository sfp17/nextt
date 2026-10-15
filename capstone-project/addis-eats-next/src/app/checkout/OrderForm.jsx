'use client';

import { useActionState, useContext, useEffect, useRef } from 'react';
import Link from 'next/link';
import { placeOrder } from '../actions';
import { CartContext } from '../providers';
import { NEIGHBOURHOODS } from '@/lib/neighbourhoods';
import { etb } from '@/lib/format';

const initialState = {
  success: false,
  fieldErrors: {},
  values: {},
  message: '',
};

// One input with its label and its server-side error, wired for screen readers.
function Field({ id, label, error, hint, ...inputProps }) {
  const Tag = inputProps.rows ? 'textarea' : 'input';
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <Tag
        id={id}
        name={id}
        className="form-control"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {error ? (
        <span id={`${id}-error`} className="error-text">{error}</span>
      ) : hint ? (
        <span id={`${id}-hint`} className="error-text" style={{ color: 'var(--ink-faint)' }}>{hint}</span>
      ) : null}
    </div>
  );
}

/**
 * The order form, hardened against double submits in three layers:
 *
 * 1. onSubmit guard: a ref flips to true on the FIRST submit, synchronously,
 *    before React has re-rendered. A second tap in the same instant is
 *    cancelled (preventDefault), so it never even reaches the server.
 *    (`disabled` alone isn't enough: two taps can land before the re-render
 *    that disables the button, and React queues form actions, so both run.)
 * 2. disabled while pending: the button can't be pressed again and says
 *    "Placing order…", so people don't tap again thinking nothing happened.
 * 3. idempotency key (server): page.js gives each form a random key; the
 *    server creates at most one order per key (lib/orders.js placeOrderOnce).
 *    This covers what the browser can't: no JS yet, a retried request, Back
 *    then resubmit.
 */
export default function OrderForm({ idempotencyKey, defaultName = '' }) {
  const { cart, total, clearCart } = useContext(CartContext);
  const [state, formAction, isPending] = useActionState(placeOrder, initialState);
  const submitting = useRef(false);

  // Validation errors came back: allow a corrected resubmit.
  useEffect(() => {
    if (!isPending) submitting.current = false;
  }, [isPending]);

  const onSubmit = (e) => {
    if (submitting.current) {
      e.preventDefault(); // second tap: cancelled before React runs the action
      return;
    }
    submitting.current = true;
  };

  // Empty the cart once the server confirms the order (not before — a failed
  // validation must not lose the customer's cart).
  useEffect(() => {
    if (state.success) clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.orderId]);

  if (state.success) {
    return (
      <div className="narrow">
        <div className="card empty-state" style={{ borderTop: '5px solid var(--gesho)' }}>
          <h1 style={{ fontSize: '1.9rem' }}>Order placed</h1>
          <p>
            Your order number is <strong style={{ color: 'var(--ink)' }}>{state.orderId}</strong>. The kitchen has it, and
            you can follow it live.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/orders/${state.orderId}`} className="btn btn-primary">Track my order</Link>
            <Link href="/menu" className="btn btn-secondary">Back to the menu</Link>
          </div>
        </div>
      </div>
    );
  }

  // Nothing to check out — don't show a form that would submit an empty order.
  if (cart.length === 0) {
    return (
      <div className="narrow">
        <div className="page-head">
          <h1>Checkout</h1>
        </div>
        <div className="card card-muted empty-state">
          <h2>Your cart is empty</h2>
          <p>Add at least one dish before you check out.</p>
          <Link href="/menu" className="btn btn-primary">Browse the menu</Link>
        </div>
      </div>
    );
  }

  const cartPayload = cart.map((c) => ({ dishId: c.id, quantity: c.quantity }));
  const errors = state?.fieldErrors ?? {};

  return (
    <>
      <div className="page-head">
        <h1>Checkout</h1>
        <p>Where should we bring your food?</p>
      </div>

      <div className="checkout-layout">
        <form action={formAction} onSubmit={onSubmit} className="card" aria-busy={isPending}>
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          {/* Progressive enhancement: the cart travels as a hidden field */}
          <input type="hidden" name="items" value={JSON.stringify(cartPayload)} />

          {state?.message && (
            <div role="alert" className="notice notice-error" style={{ marginBottom: '1.25rem' }}>
              {state.message}
              {errors.items && <div style={{ fontSize: '0.88rem' }}>{errors.items[0]}</div>}
              {state.needsSignIn && (
                <div style={{ marginTop: '0.4rem' }}>
                  <Link href="/signin?next=/checkout" style={{ fontWeight: 700, textDecoration: 'underline' }}>Sign in again</Link>{' '}
                  (your cart is kept)
                </div>
              )}
            </div>
          )}

          <Field id="fullName" label="Full name" type="text" placeholder="Abebe Bikila" autoComplete="name" required
            defaultValue={state.values?.fullName ?? defaultName} error={errors.fullName?.[0]} />
          {/* type="tel": phones show the number pad, and autofill offers the saved number */}
          <Field id="phone" label="Phone number" type="tel" inputMode="tel" placeholder="0911223344" autoComplete="tel" required
            defaultValue={state.values?.phone} error={errors.phone?.[0]} hint="Ethiopian mobile number, so the rider can call you." />
          <div className="form-group">
            <label htmlFor="neighbourhood">Neighbourhood</label>
            <select
              // React 19 resets the form after every action, and a <select> resets to the
              // option chosen when it MOUNTED. Re-mounting it with the submitted value keeps
              // the customer's area after a validation error (otherwise it silently empties
              // and the corrected form can't be sent).
              key={`area-${state.values?.neighbourhood ?? ''}`}
              id="neighbourhood"
              name="neighbourhood"
              className="form-control"
              required
              defaultValue={state.values?.neighbourhood ?? ''}
              aria-invalid={errors.neighbourhood ? 'true' : undefined}
              aria-describedby={errors.neighbourhood ? 'neighbourhood-error' : undefined}
            >
              <option value="" disabled>Choose your area</option>
              {NEIGHBOURHOODS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {errors.neighbourhood && <span id="neighbourhood-error" className="error-text">{errors.neighbourhood[0]}</span>}
          </div>
          <Field id="address" label="Delivery address" rows="3" placeholder="Bole Medhanialem, Building A, House 204" required
            autoComplete="street-address" defaultValue={state.values?.address} error={errors.address?.[0]} />

          <button
            type="submit"
            disabled={isPending}
            aria-disabled={isPending}
            className="btn btn-primary btn-block"
            style={{ padding: '0.9rem', fontSize: '1.02rem' }}
          >
            {isPending ? 'Placing order…' : `Place order · ${etb(total)}`}
          </button>
        </form>

        <aside className="card card-muted summary" aria-label="Order summary">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Your order</h2>
          {cart.map((item) => (
            <div key={item.id} className="summary-row">
              <span>{item.name} × {item.quantity}</span>
              <span>{etb(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <span>{etb(total)}</span>
          </div>
          <Link href="/cart" className="btn btn-quiet" style={{ marginTop: '0.75rem' }}>Edit cart</Link>
        </aside>
      </div>
    </>
  );
}
