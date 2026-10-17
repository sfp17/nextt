import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { isStaff } from '@/lib/roles';
import { listAllOrders } from '@/lib/orders';
import { withDemoState } from '@/lib/demoState';
import { HISTORY_DAYS, addisDayKey } from '@/lib/orderHistory';
import { NEIGHBOURHOODS } from '@/lib/neighbourhoods';
import { count, day, etb } from '@/lib/format';
import OrderTable from '../orders/OrderTable';
import { RevenueChart, OrdersLineChart } from './RevenueChart';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Dashboard',
  description: 'Staff dashboard: revenue by neighbourhood and orders per day.',
  robots: { index: false, follow: false },
};


/**
 * Aggregation happens HERE, on the server. Every order (hundreds of records with
 * names, phone numbers and addresses) stays on the server; the chart component
 * receives only 8 + 30 small numbers. That is both faster (less to send) and
 * safer (no customer data in the browser).
 */
function summarise(orders, now = Date.now()) {
  // The last 30 calendar days in Addis Ababa, oldest first: "2026-09-15" … "2026-10-14"
  const days = Array.from({ length: HISTORY_DAYS }, (_, i) => addisDayKey(now - (HISTORY_DAYS - 1 - i) * 86400000));
  const inRange = orders.filter((o) => addisDayKey(o.createdAt) >= days[0]);
  const paid = inRange.filter((o) => o.status !== 'cancelled'); // cancelled orders earned nothing

  const revenue = new Map(NEIGHBOURHOODS.map((n) => [n, 0]));
  for (const o of paid) {
    const area = o.neighbourhood ?? 'Not recorded'; // orders placed before the field existed
    revenue.set(area, (revenue.get(area) ?? 0) + o.total);
  }
  const byArea = [...revenue]
    .map(([area, value]) => ({ area, revenue: value }))
    .filter((r) => r.area !== 'Not recorded' || r.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const counts = new Map(days.map((d) => [d, 0]));
  for (const o of inRange) counts.set(addisDayKey(o.createdAt), counts.get(addisDayKey(o.createdAt)) + 1);
  const byDay = days.map((d) => ({ day: d, label: day(`${d}T12:00:00+03:00`), orders: counts.get(d) }));

  const totalRevenue = paid.reduce((s, o) => s + o.total, 0);
  return {
    byArea,
    byDay,
    range: `${byDay[0].label} – ${byDay.at(-1).label}`,
    totals: {
      revenue: totalRevenue,
      orders: inRange.length,
      average: paid.length ? Math.round(totalRevenue / paid.length) : 0,
      cancelled: inRange.length - paid.length,
    },
  };
}

// The four states:
//   loading → loading.js                  /dashboard?demo=slow
//   empty   → "No orders yet" below       /dashboard?demo=empty
//   error   → error.js                    /dashboard?demo=error
//   loaded  → charts + tables
export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const { user } = await requireUser('/dashboard');

  // Role check on the server: hiding the nav link is not security.
  if (!isStaff(user.role)) {
    return (
      <div className="narrow">
        <div className="card empty-state">
          <h1 style={{ fontSize: '1.9rem' }}>Staff only (403)</h1>
          <p>You&apos;re signed in as {user.name}. The dashboard is only for Addis Eats staff.</p>
          <Link href="/menu" className="btn btn-primary">Back to the menu</Link>
        </div>
      </div>
    );
  }

  const orders = await withDemoState(params.demo, () => listAllOrders());

  // Built first, as the slide suggests: the empty state is what a new restaurant sees on day one.
  if (orders.length === 0) {
    return (
      <div className="wide">
        <DashboardHead />
        <div className="card card-muted empty-state">
          <h2>No orders in the last {HISTORY_DAYS} days</h2>
          <p>
            Revenue by neighbourhood and orders per day appear here as soon as the first order is placed. Nothing is
            broken: there is simply nothing to count yet.
          </p>
          <Link href="/menu" className="btn btn-primary">Open the menu</Link>
        </div>
      </div>
    );
  }

  const { byArea, byDay, range, totals } = summarise(orders);
  const busiest = byDay.reduce((a, b) => (b.orders > a.orders ? b : a));
  const top = byArea[0];

  return (
    <div className="wide">
      <DashboardHead range={range} />

      <dl className="stat-tiles">
        <div className="stat-tile"><dt>Revenue</dt><dd>{etb(totals.revenue, { unit: false })} <small>ETB</small></dd></div>
        <div className="stat-tile"><dt>Orders</dt><dd>{count(totals.orders)}</dd></div>
        <div className="stat-tile"><dt>Average order</dt><dd>{etb(totals.average, { unit: false })} <small>ETB</small></dd></div>
        <div className="stat-tile"><dt>Cancelled</dt><dd>{totals.cancelled}</dd></div>
      </dl>

      <div className="chart-grid">
        <section className="card chart-card" aria-labelledby="rev-heading">
          <h2 id="rev-heading" className="chart-title">Revenue by neighbourhood</h2>
          <p className="chart-sub">{range} · ETB · delivered and active orders (cancelled excluded)</p>
          <RevenueChart
            data={byArea}
            label={`Bar chart of revenue by neighbourhood, ${range}. Highest: ${top.area}, ${etb(top.revenue)}. The same data is in the table below.`}
          />
          <details className="chart-table">
            <summary>Show the data as a table</summary>
            <table className="data-table">
              <caption>Revenue by neighbourhood, {range}, in ETB</caption>
              <thead>
                <tr><th scope="col">Neighbourhood</th><th scope="col" className="num">Revenue (ETB)</th></tr>
              </thead>
              <tbody>
                {byArea.map((r) => (
                  <tr key={r.area}><th scope="row">{r.area}</th><td className="num">{etb(r.revenue, { unit: false })}</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <section className="card chart-card" aria-labelledby="day-heading">
          <h2 id="day-heading" className="chart-title">Orders per day, {range}</h2>
          <p className="chart-sub">Number of orders placed each day (Addis Ababa time), including cancelled</p>
          <OrdersLineChart
            data={byDay}
            label={`Line chart of orders per day, ${range}. Busiest day: ${busiest.label} with ${busiest.orders} orders; today so far: ${byDay.at(-1).orders}. The same data is in the table below.`}
          />
          <details className="chart-table">
            <summary>Show the data as a table</summary>
            <table className="data-table">
              <caption>Orders per day, {range}</caption>
              <thead>
                <tr><th scope="col">Day</th><th scope="col" className="num">Orders</th></tr>
              </thead>
              <tbody>
                {byDay.map((d) => (
                  <tr key={d.day}><th scope="row"><time dateTime={d.day}>{d.label}</time></th><td className="num">{d.orders}</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>
      </div>

      <section className="dash-orders" aria-labelledby="all-orders-heading">
        <h2 id="all-orders-heading" className="chart-title">All orders</h2>
        <OrderTable
          orders={orders}
          searchParams={params}
          basePath="/dashboard"
          showCustomer
          caption="Every customer's orders."
        />
      </section>
    </div>
  );
}

function DashboardHead({ range }) {
  return (
    <div className="page-head">
      <h1>Dashboard</h1>
      <p>{range ? `Last ${HISTORY_DAYS} days (${range}), Addis Ababa time.` : 'Staff overview of Addis Eats orders.'}</p>
    </div>
  );
}
