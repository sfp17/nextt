// Shown while the menu route loads: same shape as the real page, so nothing jumps.
export default function MenuLoading() {
  return (
    <div aria-busy="true" aria-label="Loading the menu">
      <div className="skeleton" style={{ height: 40, width: 160, marginBottom: '0.75rem' }} />
      <div className="skeleton" style={{ height: 20, width: '50%', marginBottom: '1.5rem' }} />
      <div className="skeleton" style={{ height: 48, borderRadius: 999, marginBottom: '1rem' }} />
      <div className="dish-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton" style={{ aspectRatio: '4 / 4.6' }} />
        ))}
      </div>
    </div>
  );
}
