'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CartContext } from './providers';
import { etb } from '@/lib/format';

// Phones only (CSS): once something is in the cart, a bar at the bottom shows
// the count and total and goes to the cart in one tap, so nobody has to scroll
// back up and open the menu to find it. Hidden where it would be in the way.
const HIDDEN_ON = ['/cart', '/checkout', '/signin', '/signup'];

export default function MobileCartBar() {
  const { itemCount, total } = useContext(CartContext);
  const pathname = usePathname();
  if (itemCount === 0 || HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      <div className="mobile-cart-spacer" aria-hidden="true" />
      <div className="mobile-cart-bar">
        <span className="mobile-cart-summary">
          <strong>{itemCount} {itemCount === 1 ? 'item' : 'items'}</strong> · {etb(total)}
        </span>
        <Link href="/cart" className="btn btn-primary">
          View cart <span aria-hidden="true">→</span>
        </Link>
      </div>
    </>
  );
}
