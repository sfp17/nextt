// A single order is one card, not a table, so it gets its own (smaller) skeleton
// instead of inheriting /orders/loading.js.
export default function OrderLoading() {
  return (
    <div className="narrow" aria-busy="true">
      <p className="sr-only" role="status">Loading the order…</p>
      <div className="card" aria-hidden="true" style={{ minHeight: '22rem' }}>
        <p className="skeleton-text" style={{ width: '40%', height: '1.6rem' }} />
        <p className="skeleton-text" style={{ width: '70%', marginTop: '1rem' }} />
        <p className="skeleton-text" style={{ width: '55%', marginTop: '0.6rem' }} />
      </div>
    </div>
  );
}
