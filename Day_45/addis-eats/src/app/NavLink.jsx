'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Marks the link for the page you're on with aria-current, which the CSS
// highlights (and screen readers announce as "current page").
export default function NavLink({ href, children, className = 'nav-link' }) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={className} aria-current={active ? 'page' : undefined}>
      {children}
    </Link>
  );
}
