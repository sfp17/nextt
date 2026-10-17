import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrder } from '@/lib/orders';
import { isHistoryId } from '@/lib/orderHistory';
import { etb, when } from '@/lib/format';
import { removeOrder } from '../../actions';
import ConfirmAction from '../../ConfirmAction';
import OrderForm from '../OrderForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit order' };

export default async function EditOrder({ params }) {
  const { id } = await params;
  const order = isHistoryId(id) ? null : await getOrder(id); // generated history is read-only
  if (!order) notFound();
  const { fullName, phone, neighbourhood, address, status } = order;

  return (
    <>
      <div className="admin-row">
        <h1 className="admin-title">Order {order.id}</h1>
        <ConfirmAction action={removeOrder.bind(null, order.id)} label="Delete order" confirm={`Delete order ${order.id}?`} pendingLabel="Deleting…" />
      </div>
      <div className="card card-muted admin-summary">
        <p>Placed {when(order.createdAt)} · {etb(order.total)}</p>
        <ul>
          {order.items.map((i) => <li key={i.dishId}>{i.name} × {i.quantity} · {etb(i.price * i.quantity)}</li>)}
        </ul>
        <p><Link href={`/track/${order.id}`} className="inline-link">Customer&apos;s tracking page</Link> (opens for the customer who owns it)</p>
      </div>
      <OrderForm order={{ id: order.id, fullName, phone, neighbourhood: neighbourhood ?? '', address, status }} />
    </>
  );
}
