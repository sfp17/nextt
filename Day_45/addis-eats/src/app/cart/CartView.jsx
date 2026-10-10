'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { CartContext } from '../providers';

export default function CartView() {
  const { cart, itemCount, total, setQuantity, removeFromCart, clearCart } = useContext(CartContext);

  if (cart.length === 0) {
    return (
      <div className="narrow">
        <div className="page-head">
          <h1>Your cart</h1>
        </div>
        <div className="card card-muted empty-state">
          <h2>Your cart is empty</h2>
          <p>Add a few dishes from the menu and they&apos;ll show up here.</p>
          <Link href="/menu" className="btn btn-primary">Browse the menu</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>Your cart</h1>
        <p>{itemCount} {itemCount === 1 ? 'item' : 'items'}. Change quantities here before you check out.</p>
      </div>

      <div className="cart-layout">
        <div className="card">
          <ul style={{ listStyle: 'none' }}>
            {cart.map((item) => (
              <li key={item.id} className="cart-row">
                <div className="cart-row-info">
                  <strong>{item.name}</strong>
                  <p>{item.price} ETB each</p>
                </div>
                <div className="cart-row-controls">
                  <div className="qty-control" role="group" aria-label={`Quantity of ${item.name}`}>
                    <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= 20}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="price" style={{ minWidth: '5.5rem', textAlign: 'right' }}>
                    {item.price * item.quantity}
                    <small>ETB</small>
                  </span>
                  <button type="button" onClick={() => removeFromCart(item.id)} className="btn btn-quiet" aria-label={`Remove ${item.name}`}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="card summary" aria-label="Order summary">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Summary</h2>
          <div className="summary-row">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>{total} ETB</span>
          </div>
          <Link href="/checkout" className="btn btn-primary btn-block" style={{ marginTop: '1.25rem' }}>
            Go to checkout
          </Link>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Remove every item from your cart?')) clearCart();
            }}
            className="btn btn-quiet btn-block"
            style={{ marginTop: '0.5rem' }}
          >
            Empty cart
          </button>
        </aside>
      </div>
    </>
  );
}
