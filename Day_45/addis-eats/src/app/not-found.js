import Link from 'next/link';

export const metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <div className="narrow">
      <div className="card card-muted empty-state">
        <h1 style={{ fontSize: '1.9rem' }}>Page not found</h1>
        <p>There&apos;s no page at this address. It may have moved, or the link has a typo.</p>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary">Go to the home page</Link>
          <Link href="/menu" className="btn btn-secondary">Browse the menu</Link>
        </div>
      </div>
    </div>
  );
}