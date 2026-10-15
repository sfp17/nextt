// Shown while /orders is loading. Shaped like the real table (header + five rows),
// so nothing jumps when the data arrives. Force it with /orders?demo=slow.
export default function OrdersLoading() {
  return (
    <div className="wide" aria-busy="true">
      <div className="page-head">
        <h1>My orders</h1>
        <p className="skeleton-text" style={{ width: '16rem' }} />
      </div>
      <p className="sr-only" role="status">Loading your orders…</p>
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}

export function TableSkeleton({ rows, columns }) {
  return (
    <div className="table-scroll" aria-hidden="true">
      <table className="data-table skeleton-table">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, c) => (
              <th key={c}><span className="skeleton-text" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }, (_, c) => (
                <td key={c}><span className="skeleton-text" style={{ width: `${55 + ((r * 7 + c * 13) % 40)}%` }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
