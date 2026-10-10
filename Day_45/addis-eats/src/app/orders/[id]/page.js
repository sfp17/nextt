import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { getOrderForOwner } from '@/lib/orders';
import OrderStatus from './OrderStatus';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Order ${id}`,
    description: `Live delivery status for Addis Eats order ${id}.`,
    robots: { index: false, follow: false },
  };
}

export default async function OrderPage({ params }) {
  const { id } = await params;

  // Layer 2: the proxy saw *a* cookie; this checks it's a real session.
  const { user } = await requireUser(`/orders/${id}`);

  // Layer 3: the query itself is scoped to the session's user ID.
  // Someone else's order ID → 404, exactly like an order that doesn't exist.
  const order = await getOrderForOwner(id, user.id);
  if (!order) notFound();

  return (
    <div className="narrow">
      <Link href="/orders" className="back-link">← My orders</Link>
      <div className="page-head">
        <h1>Track your order</h1>
      </div>
      <OrderStatus id={id} initialOrder={order} />
    </div>
  );
}
