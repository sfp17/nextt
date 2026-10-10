import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { listOrdersForOwner } from '@/lib/orders';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'My Orders',
  description: 'Your Addis Eats order history and live delivery status.',
  robots: { index: false, follow: false },
};

export default async function MyOrdersPage() {
  const { user } = await requireUser('/orders');
  const orders = await listOrdersForOwner(user.id); // only THIS user's orders

  return (
    <div className="narrow">
      <div className="page-head">
        <h1>My orders</h1>
        <p>Signed in as {user.name}. Open an order to follow it live.</p>
      </div>

      {orders.length === 0 ? (
        <div className="card card-muted empty-state">
          <h2>No orders yet</h2>
          <p>When you place an order, it shows up here so you can track it.</p>
          <Link href="/menu" className="btn btn-primary">Browse the menu</Link>
        </div>
      ) : (
        <ul className="order-list">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="order-row">
                <div style={{ minWidth: 0 }}>
                  <strong>{o.id}</strong>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                    {o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className={`status-pill ${o.status}`}>{o.statusLabel}</span>
                  <p className="price" style={{ marginTop: '0.35rem' }}>{o.total} <small>ETB</small></p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
