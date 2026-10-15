'use client';

import { useContext } from 'react';
import { CartContext } from './providers';
import NavLink from './NavLink';

export default function CartLink() {
  const { itemCount } = useContext(CartContext);
  return (
    <NavLink href="/cart" className="nav-link cart-link">
      Cart
      {itemCount > 0 && (
        <span className="cart-badge" aria-label={`${itemCount} items`}>
          {itemCount}
        </span>
      )}
    </NavLink>
  );
}
