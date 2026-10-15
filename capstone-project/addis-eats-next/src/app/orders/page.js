import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { listOrdersForOwner } from '@/lib/orders';
import { withDemoState } from '@/lib/demoState';
import OrderTable from './OrderTable';
import ExportCsvButton from './ExportCsvButton';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'My Orders',
  description: 'Your Addis Eats order history and live delivery status.',
  robots: { index: false, follow: false },
};

// The four states of this page:
//   loading → loading.js (five skeleton rows)     force it: /orders?demo=slow
//   empty   → "No orders yet" below               force it: /orders?demo=empty (or sign in as Sara)
//   error   → error.js                            force it: /orders?demo=error
//   loaded  → the table
export default async function MyOrdersPage({ searchParams }) {
  const params = await searchParams; // a Promise in Next 15+
  const { user } = await requireUser('/orders');
  const orders = await withDemoState(params.demo, () => listOrdersForOwner(user.id)); // only THIS user's orders

  return (
    <div className="wide">
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
        <>
          <ExportCsvButton
            rows={orders.map((o) => ({
              // only what the export needs crosses to the browser (no phone number, no owner id)
              id: o.id,
              createdAt: o.createdAt,
              statusLabel: o.statusLabel,
              neighbourhood: o.neighbourhood ?? null,
              address: o.address,
              items: o.items.map((i) => `${i.name} × ${i.quantity}`).join(', '),
              total: o.total,
            }))}
          />
          <OrderTable orders={orders} searchParams={params} basePath="/orders" caption="Your orders." />
        </>
      )}
    </div>
  );
}
