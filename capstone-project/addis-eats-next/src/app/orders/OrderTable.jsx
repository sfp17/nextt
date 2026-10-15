import Link from 'next/link';
import { etb, when } from '@/lib/format';

/**
 * A real <table>: caption, column headers with scope, aria-sort on the sorted
 * column. Server component — no JavaScript is sent for it.
 *
 * Everything that describes the view lives in the URL:
 *   ?sort=total&dir=asc&page=2
 * so a sorted, paged view can be bookmarked, shared, reloaded and navigated with
 * Back. Sorting and paging are plain links: they work before (and without) JS.
 */

export const PER_PAGE = 10;

const COLUMNS = {
  date: { label: 'Placed', value: (o) => o.createdAt, firstDir: 'desc' },
  customer: { label: 'Customer', value: (o) => o.fullName ?? '', firstDir: 'asc' },
  area: { label: 'Neighbourhood', value: (o) => o.neighbourhood ?? '', firstDir: 'asc' },
  total: { label: 'Total (ETB)', value: (o) => o.total, firstDir: 'desc' },
  status: { label: 'Status', value: (o) => o.statusLabel, firstDir: 'asc' },
};

const DIR_WORDS = {
  date: { asc: 'oldest first', desc: 'newest first' },
  total: { asc: 'smallest first', desc: 'largest first' },
};



/** Read sort/dir/page from searchParams, accepting only known values. */
export function readTableParams(searchParams, { showCustomer }) {
  const allowed = Object.keys(COLUMNS).filter((k) => showCustomer || k !== 'customer');
  const sort = allowed.includes(searchParams?.sort) ? searchParams.sort : 'date';
  const dir = searchParams?.dir === 'asc' || searchParams?.dir === 'desc' ? searchParams.dir : COLUMNS[sort].firstDir;
  const page = Math.max(1, Number.parseInt(searchParams?.page, 10) || 1);
  return { sort, dir, page };
}

function hrefWith(basePath, params, changes) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...changes })) {
    if (v != null && v !== '' && !(k === 'page' && Number(v) === 1)) next.set(k, String(v));
  }
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function OrderTable({ orders, searchParams, basePath, showCustomer = false, caption }) {
  const { sort, dir, page: askedPage } = readTableParams(searchParams, { showCustomer });

  const column = COLUMNS[sort];
  const sorted = [...orders].sort((a, b) => {
    const x = column.value(a);
    const y = column.value(b);
    const cmp = typeof x === 'number' ? x - y : String(x).localeCompare(String(y));
    return (dir === 'asc' ? cmp : -cmp) || b.createdAt - a.createdAt; // ties: newest first
  });

  const pageCount = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const page = Math.min(askedPage, pageCount);
  const rows = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const first = (page - 1) * PER_PAGE + 1;
  const last = first + rows.length - 1;

  // Params kept when building links (the demo switch is deliberately dropped).
  const keep = { sort: sort === 'date' && dir === 'desc' ? null : sort, dir: sort === 'date' && dir === 'desc' ? null : dir, page };

  const headers = [
    'date',
    ...(showCustomer ? ['customer'] : []),
    'area',
    'total',
    'status',
  ];
  const dirWord = DIR_WORDS[sort]?.[dir] ?? (dir === 'asc' ? 'A to Z' : 'Z to A');

  return (
    <div className="table-block">
      <div className="table-scroll" role="region" aria-labelledby="order-table-caption" tabIndex={0}>
        <table className="data-table">
          <caption id="order-table-caption">
            {caption}{' '}
            <span className="caption-state">
              Sorted by {column.label.replace(' (ETB)', '').toLowerCase()}, {dirWord}. Showing {first}–{last} of{' '}
              {sorted.length}.
            </span>
          </caption>
          <thead>
            <tr>
              <th scope="col">Order</th>
              {headers.map((key) => {
                const active = key === sort;
                const nextDir = active ? (dir === 'asc' ? 'desc' : 'asc') : COLUMNS[key].firstDir;
                return (
                  <th
                    key={key}
                    scope="col"
                    aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={key === 'total' ? 'num' : undefined}
                  >
                    <Link
                      href={hrefWith(basePath, keep, { sort: key, dir: nextDir, page: 1 })}
                      className="sort-link"
                      scroll={false}
                    >
                      {COLUMNS[key].label}
                      <span aria-hidden="true" className="sort-mark">
                        {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </Link>
                  </th>
                );
              })}
              <th scope="col">Items</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <th scope="row">
                  {basePath === '/orders' ? <Link href={`/orders/${o.id}`}>{o.id}</Link> : o.id}
                </th>
                <td>
                  <time dateTime={new Date(o.createdAt).toISOString()}>{when(o.createdAt)}</time>
                </td>
                {showCustomer && <td>{o.fullName}</td>}
                <td>{o.neighbourhood ?? '—'}</td>
                <td className="num">{etb(o.total, { unit: false })}</td>
                <td>
                  <span className={`status-pill ${o.status}`}>{o.statusLabel}</span>
                </td>
                <td className="items-cell">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="pager" aria-label="Order table pages">
        {page > 1 ? (
          <Link href={hrefWith(basePath, keep, { page: page - 1 })} className="btn btn-secondary" scroll={false}>
            ← Previous
          </Link>
        ) : (
          <span className="btn btn-secondary" aria-disabled="true">← Previous</span>
        )}
        <span className="pager-state" aria-current="page">
          Page {page} of {pageCount}
        </span>
        {page < pageCount ? (
          <Link href={hrefWith(basePath, keep, { page: page + 1 })} className="btn btn-secondary" scroll={false}>
            Next →
          </Link>
        ) : (
          <span className="btn btn-secondary" aria-disabled="true">Next →</span>
        )}
      </nav>
    </div>
  );
}
