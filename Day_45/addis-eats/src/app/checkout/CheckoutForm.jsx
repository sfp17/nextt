'use client';

import { useActionState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { placeOrder } from '../actions';
import { CartContext } from '../providers';

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

export default function CheckoutForm() {
  const { cart, total, clearCart } = useContext(CartContext);
  const [state, formAction, isPending] = useActionState(placeOrder, initialState);

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
        <form action={formAction} className="card">
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
            defaultValue={state.values?.fullName} error={errors.fullName?.[0]} />
          <Field id="phone" label="Phone number" type="tel" placeholder="0911223344" autoComplete="tel" required
            defaultValue={state.values?.phone} error={errors.phone?.[0]} hint="Ethiopian mobile number, so the rider can call you." />
          <Field id="address" label="Delivery address" rows="3" placeholder="Bole Medhanialem, Building A, House 204" required
            autoComplete="street-address" defaultValue={state.values?.address} error={errors.address?.[0]} />

          <button type="submit" disabled={isPending} className="btn btn-primary btn-block" style={{ padding: '0.9rem', fontSize: '1.02rem' }}>
            {isPending ? 'Placing order…' : `Place order · ${total} ETB`}
          </button>
        </form>

        <aside className="card card-muted summary" aria-label="Order summary">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Your order</h2>
          {cart.map((item) => (
            <div key={item.id} className="summary-row">
              <span>{item.name} × {item.quantity}</span>
              <span>{item.price * item.quantity} ETB</span>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <span>{total} ETB</span>
          </div>
          <Link href="/cart" className="btn btn-quiet" style={{ marginTop: '0.75rem' }}>Edit cart</Link>
        </aside>
      </div>
    </>
  );
}
