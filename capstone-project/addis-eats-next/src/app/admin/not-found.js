import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="card card-muted empty-state">
      <h1 style={{ fontSize: '1.6rem' }}>Not found</h1>
      <p>It may have been deleted, or it can&apos;t be edited (built-in accounts and generated past orders are read-only).</p>
      <Link href="/admin" className="btn btn-primary">Back to the admin overview</Link>
    </div>
  );
}
