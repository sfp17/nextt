import Link from 'next/link';

export const metadata = {
  title: 'Order not found',
  robots: { index: false },
};

export default function OrderNotFound() {
  return (
    <div className="narrow">
      <div className="card card-muted empty-state">
        <h1 style={{ fontSize: '1.9rem' }}>Order not found</h1>
        <p>We couldn&apos;t find that order in your account.</p>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/orders" className="btn btn-primary">See my orders</Link>
        </div>
      </div>
    </div>
  );
}
