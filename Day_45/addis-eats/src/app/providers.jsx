'use client';

import { createContext, useMemo, useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, getServerSnapshot, updateCart } from '@/lib/cartStore';

// Two contexts on purpose (INP, see PERF.md):
//  - CartActionsContext: the functions. They never change, so components that
//    only ADD (every "Add to order" button) don't re-render when the cart does.
//  - CartContext: the cart contents and totals, for the badge, cart and checkout.
export const CartContext = createContext(null);
export const CartActionsContext = createContext(null);

// Defined once at module level: stable identities for the whole app's lifetime.
const actions = {
  // Only id/name/price/quantity go in the cart; prices are re-checked on the server anyway.
  addToCart: (dish) =>
    updateCart((prev) => {
      const existing = prev.find((item) => item.id === dish.id);
      if (existing) {
        return prev.map((item) => (item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { id: dish.id, name: dish.name, price: dish.price, quantity: 1 }];
    }),
  setQuantity: (id, quantity) =>
    updateCart((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.id !== id)
        : prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(quantity, 20) } : item))
    ),
  removeFromCart: (id) => updateCart((prev) => prev.filter((item) => item.id !== id)),
  clearCart: () => updateCart(() => []),
};

export default function Providers({ children }) {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo(() => {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { cart, itemCount, total, ...actions };
  }, [cart]);

  return (
    <CartActionsContext.Provider value={actions}>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
    </CartActionsContext.Provider>
  );
}
