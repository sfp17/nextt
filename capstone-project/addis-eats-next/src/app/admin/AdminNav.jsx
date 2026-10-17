'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/users', label: 'Users' },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="admin-tabs">
      {TABS.map((t) => {
        const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className="admin-tab" aria-current={active ? 'page' : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
