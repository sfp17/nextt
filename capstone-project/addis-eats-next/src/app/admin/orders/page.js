import Link from 'next/link';
import { listStoredOrders } from '@/lib/orders';
import { listUsers } from '@/lib/users';
import { etb, when } from '@/lib/format';
import { removeOrder } from '../actions';
import ConfirmAction from '../ConfirmAction';
import Notice from '../Notice';
import StatusSelect from './StatusSelect';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Orders' };

const FILTERS = [
  ['all', 'All'],
  ['active', 'Active'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
];

export default async function AdminOrders({ searchParams }) {
  const { done, name, show = 'all' } = await searchParams;
  const [orders, users] = await Promise.all([listStoredOrders(), listUsers()]);
  const names = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const shown = orders.filter((o) =>
    show === 'active' ? !['delivered', 'cancelled'].includes(o.status) : show === 'all' ? true : o.status === show
  );

  return (
    <>
      <div className="admin-row">
        <h1 className="admin-title">Orders <span className="admin-count">{orders.length} placed in the app</span></h1>
        <Link href="/admin/orders/new" className="btn btn-primary">+ New order</Link>
      </div>
      <Notice done={done} name={name} />

      <nav className="chips" aria-label="Filter orders">
        {FILTERS.map(([key, label]) => (
          <Link key={key} href={key === 'all' ? '/admin/orders' : `/admin/orders?show=${key}`} className="chip" aria-current={show === key ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <div className="card card-muted empty-state"><h2>No orders here</h2><p>Orders customers place appear here straight away.</p></div>
      ) : (
        <div className="table-scroll">
          <table className="data-table admin-table">
            <caption className="visually-hidden">Orders placed in the app, newest first</caption>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Placed</th>
                <th scope="col" className="num">Total (ETB)</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id}>
                  <th scope="row">{o.id}</th>
                  <td>
                    {o.fullName}
                    <small className="muted"> · {o.ownerId ? (names[o.ownerId] ? 'account' : 'deleted account') : 'walk-in'}</small>
                  </td>
                  <td><time dateTime={new Date(o.createdAt).toISOString()}>{when(o.createdAt)}</time></td>
                  <td className="num">{etb(o.total, { unit: false })}</td>
                  <td><StatusSelect id={o.id} status={o.status} /></td>
                  <td className="admin-actions">
                    <Link href={`/admin/orders/${o.id}`} className="btn btn-secondary">Edit</Link>
                    <ConfirmAction action={removeOrder.bind(null, o.id)} label="Delete" confirm={`Delete order ${o.id}? The customer will no longer see it.`} pendingLabel="Deleting…" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="admin-help">
        Changing a status here updates the customer&apos;s order page within 5 seconds and the live map within a second.
        The 30 days of generated past orders are read-only and shown on the <Link href="/dashboard" className="inline-link">Dashboard</Link>.
      </p>
    </>
  );
}
