import Link from 'next/link';
import { getMenu } from '@/lib/menu';
import { listStoredOrders } from '@/lib/orders';
import { listUsers } from '@/lib/users';
import { etb, count } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Overview' };

export default async function AdminOverview() {
  const [menu, orders, users] = await Promise.all([getMenu({ includeHidden: true }), listStoredOrders(), listUsers()]);
  const active = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const hidden = menu.filter((d) => d.available === false).length;
  const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  const cards = [
    { href: '/admin/menu', title: 'Menu', big: count(menu.length), sub: hidden ? `dishes · ${hidden} hidden` : 'dishes, all visible', cta: 'Manage dishes' },
    { href: '/admin/orders', title: 'Orders', big: count(active.length), sub: `active · ${count(orders.length)} placed in the app · ${etb(revenue)}`, cta: 'Manage orders' },
    { href: '/admin/users', title: 'Users', big: count(users.length), sub: `accounts · ${users.filter((u) => u.role !== 'customer').length} staff or admin`, cta: 'Manage users' },
  ];

  return (
    <>
      <h1 className="admin-title">Overview</h1>
      <div className="admin-cards">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card admin-card">
            <span className="admin-card-title">{c.title}</span>
            <span className="admin-card-big">{c.big}</span>
            <span className="admin-card-sub">{c.sub}</span>
            <span className="admin-card-cta">{c.cta} →</span>
          </Link>
        ))}
      </div>
      <p className="admin-help">
        Changes here are live: the public menu, the customer&apos;s order and tracking pages, and sign-in all read the
        same data. Charts and the 30-day history are on the <Link href="/dashboard" className="inline-link">Dashboard</Link>;
        the live kitchen view is the <Link href="/kitchen" className="inline-link">Kitchen board</Link>.
      </p>
    </>
  );
}
