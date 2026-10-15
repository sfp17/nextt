import { headers } from 'next/headers';
import { requireUser } from '@/lib/session';

// Same reason as app/orders/layout.js: check the session BEFORE loading.js streams,
// so signed-out visitors get a real 307 instead of a skeleton then a redirect.
// The staff-role check stays in the page, next to the data it protects.
export default async function DashboardLayout({ children }) {
  const returnTo = (await headers()).get('x-return-to') ?? '/dashboard'; // set by src/proxy.js
  await requireUser(returnTo);
  return children;
}
