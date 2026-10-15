import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { getOrderForOwner } from '@/lib/orders';
import { trackingSnapshot, KITCHEN } from '@/lib/delivery';
import TrackLive from './TrackLive';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Tracking ${id}`,
    description: `Live map and delivery status for Addis Eats order ${id}.`,
    robots: { index: false, follow: false },
  };
}

// Server component: checks the session and ownership, then renders the FIRST
// snapshot into the HTML (status, courier, address, ETA). The page is useful
// before any JavaScript runs; the stream only keeps it current.
export default async function TrackPage({ params }) {
  const { id } = await params;
  const { user } = await requireUser(`/track/${id}`);
  const order = await getOrderForOwner(id, user.id); // someone else's order → 404
  if (!order) notFound();

  return (
    <div className="wide">
      <Link href={`/orders/${order.id}`} className="back-link">← Order details</Link>
      <div className="page-head">
        <h1>Track your delivery</h1>
        <p>Order {order.id} · the map and the details beside it update by themselves.</p>
      </div>
      <TrackLive initial={trackingSnapshot(order)} kitchen={KITCHEN} />
    </div>
  );
}
