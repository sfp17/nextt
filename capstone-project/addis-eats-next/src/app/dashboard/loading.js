import { TableSkeleton } from '../orders/loading';

// The dashboard's skeleton keeps the real layout: four tiles, two chart boxes at
// their real heights, then table rows. Force it with /dashboard?demo=slow.
export default function DashboardLoading() {
  return (
    <div className="wide" aria-busy="true">
      <div className="page-head">
        <h1>Dashboard</h1>
        <p className="skeleton-text" style={{ width: '18rem' }} />
      </div>
      <p className="sr-only" role="status">Loading the dashboard…</p>
      <div aria-hidden="true">
        <div className="stat-tiles">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="stat-tile"><span className="skeleton-text" style={{ width: '50%' }} /><span className="skeleton-text" style={{ width: '70%', height: '1.6rem', marginTop: '0.5rem' }} /></div>
          ))}
        </div>
        <div className="chart-grid">
          <div className="card chart-card"><div className="skeleton-block" style={{ height: 36 + 8 * 34 + 60 }} /></div>
          <div className="card chart-card"><div className="skeleton-block" style={{ height: 280 + 60 }} /></div>
        </div>
      </div>
      <div className="dash-orders"><TableSkeleton rows={5} columns={7} /></div>
    </div>
  );
}
