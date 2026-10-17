'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { NEIGHBOURHOODS } from '@/lib/neighbourhoods';
import { etb } from '@/lib/format';
import { adminCreateOrder, adminUpdateOrder } from '../actions';

const STATUSES = [
  ['placed', 'Order placed'],
  ['preparing', 'Preparing'],
  ['on_the_way', 'On the way'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
];

function Err({ id, errors }) {
  return errors?.[id] ? <span id={`${id}-error`} className="error-text">{errors[id][0]}</span> : null;
}
const a11y = (id, errors) => ({
  'aria-invalid': errors?.[id] ? 'true' : undefined,
  'aria-describedby': errors?.[id] ? `${id}-error` : undefined,
});

/** order = edit an existing order; no order = create one (with dishes and an optional customer). */
export default function OrderForm({ order, customers = [], dishes = [] }) {
  const [state, formAction, pending] = useActionState(order ? adminUpdateOrder : adminCreateOrder, {
    values: order ?? {},
    fieldErrors: {},
    error: '',
  });
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="card admin-form" noValidate aria-busy={pending}>
      {order && <input type="hidden" name="id" value={order.id} />}
      {state.error && <p role="alert" className="notice notice-error">{state.error}</p>}

      {order ? (
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" className="form-control" defaultValue={v.status ?? order.status} key={`st-${v.status ?? order.status}`} {...a11y('status', e)}>
            {STATUSES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
          <span className="field-hint">The customer sees the change on their order and tracking pages within seconds.</span>
          <Err id="status" errors={e} />
        </div>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="ownerId">Customer account</label>
            <select id="ownerId" name="ownerId" className="form-control" defaultValue={v.ownerId ?? ''} key={`ow-${v.ownerId ?? ''}`} {...a11y('ownerId', e)}>
              <option value="">Walk-in / phone order (no account)</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
            </select>
            <span className="field-hint">With an account, the order appears in that customer&apos;s “My orders”.</span>
            <Err id="ownerId" errors={e} />
          </div>
          <fieldset className="form-group admin-items">
            <legend>Dishes (quantity)</legend>
            {e.items && <span className="error-text">{e.items[0]}</span>}
            <div className="admin-items-grid">
              {dishes.map((d) => (
                <label key={d.id} className="admin-item">
                  <span>{d.name} <small className="muted">{etb(d.price)}</small></span>
                  <input type="number" name={`qty_${d.id}`} min="0" max="20" step="1" inputMode="numeric" defaultValue={0} className="form-control" />
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <div className="admin-two">
        <div className="form-group">
          <label htmlFor="fullName">Name</label>
          <input id="fullName" name="fullName" className="form-control" defaultValue={v.fullName} {...a11y('fullName', e)} />
          <Err id="fullName" errors={e} />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" className="form-control" defaultValue={v.phone} {...a11y('phone', e)} />
          <Err id="phone" errors={e} />
        </div>
      </div>
      <div className="admin-two">
        <div className="form-group">
          <label htmlFor="neighbourhood">Neighbourhood</label>
          <select id="neighbourhood" name="neighbourhood" className="form-control" defaultValue={v.neighbourhood ?? ''} key={`nb-${v.neighbourhood ?? ''}`} {...a11y('neighbourhood', e)}>
            <option value="" disabled>Choose…</option>
            {NEIGHBOURHOODS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <Err id="neighbourhood" errors={e} />
        </div>
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input id="address" name="address" className="form-control" defaultValue={v.address} {...a11y('address', e)} />
          <Err id="address" errors={e} />
        </div>
      </div>

      <div className="admin-form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Saving…' : order ? 'Save changes' : 'Create order'}
        </button>
        <Link href="/admin/orders" className="btn btn-quiet">Cancel</Link>
      </div>
    </form>
  );
}
