import Link from 'next/link';

export const metadata = {
  title: 'Dish not found',
  robots: { index: false },
};

export default function DishNotFound() {
  return (
    <div className="narrow">
      <div className="card card-muted empty-state">
        <h1 style={{ fontSize: '1.9rem' }}>Dish not found</h1>
        <p>That dish isn&apos;t on the menu anymore, or the link is wrong.</p>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/menu" className="btn btn-primary">Browse the menu</Link>
        </div>
      </div>
    </div>
  );
}