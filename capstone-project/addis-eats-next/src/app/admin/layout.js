import Link from 'next/link';
import { headers } from 'next/headers';
import { requireUser } from '@/lib/session';
import { isAdmin } from '@/lib/roles';
import AdminNav from './AdminNav';

export const metadata = {
  title: { default: 'Admin', template: '%s · Admin | Addis Eats' },
  robots: { index: false, follow: false },
};

// Layer 2 for every /admin page (the proxy, layer 1, only saw that a cookie exists).
// Layer 3 is inside each server action (app/admin/actions.js): they check again.
export default async function AdminLayout({ children }) {
  const returnTo = (await headers()).get('x-return-to') ?? '/admin';
  const { user } = await requireUser(returnTo);

  if (!isAdmin(user.role)) {
    return (
      <div className="narrow">
        <div className="card empty-state">
          <h1 style={{ fontSize: '1.9rem' }}>Admins only (403)</h1>
          <p>You&apos;re signed in as {user.name}. The admin panel is only for Addis Eats administrators.</p>
          <Link href="/menu" className="btn btn-primary">Back to the menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-head">
        <div>
          <p className="admin-eyebrow">Admin panel</p>
          <p className="admin-who">Signed in as {user.name}</p>
        </div>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
