import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { listAllOrders } from '@/lib/orders';
import KitchenBoard from './KitchenBoard';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Kitchen',
  description: 'Staff kitchen board for incoming Addis Eats orders.',
  robots: { index: false, follow: false },
};

export default async function KitchenPage() {
  const { user } = await requireUser('/kitchen');

  // The role check happens HERE, on the server — not by hiding the nav link.
  // A customer who types /kitchen gets this, and never receives the order data.
  if (user.role !== 'staff') {
    return (
      <div className="narrow">
        <div className="card empty-state">
          <h1 style={{ fontSize: '1.9rem' }}>Staff only (403)</h1>
          <p>You&apos;re signed in as {user.name}. The kitchen board is only for Addis Eats kitchen staff.</p>
          <Link href="/menu" className="btn btn-primary">Back to the menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1>Kitchen board</h1>
        <p>Every customer&apos;s orders, newest first. The list refreshes every 5 seconds.</p>
      </div>
      <KitchenBoard initialOrders={await listAllOrders()} />
    </div>
  );
}
