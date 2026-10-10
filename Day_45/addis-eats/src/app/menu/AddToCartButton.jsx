'use client';

import { useContext, useEffect, useState } from 'react';
import { CartActionsContext } from '../providers';

export default function AddToCartButton({ dish, className = '' }) {
  // Actions only: this button doesn't re-render when the cart changes.
  const { addToCart } = useContext(CartActionsContext);
  const [added, setAdded] = useState(false);

  // Reset the "Added" label after 1.5s; cleared if the button unmounts
  // or is clicked again, so a stale timer never fires.
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      onClick={() => {
        addToCart(dish);
        setAdded(true);
      }}
      className={`btn btn-primary ${className} ${added ? 'is-added' : ''}`}
      aria-live="polite"
    >
      {added ? 'Added ✓' : 'Add to order'}
    </button>
  );
}
