import { headers } from 'next/headers';
import { requireUser } from '@/lib/session';

// Why a layout check as well as the page check: loading.js wraps the PAGE in a
// Suspense boundary, so the skeleton is sent (status 200) before the page runs.
// A redirect from the page then has to happen in the browser. The layout runs
// before that boundary, so a forged or expired session gets a real 307 to /signin
// and not even the skeleton. The page still checks too (layouts don't re-run on
// every navigation), and every query is still owner-scoped.
export default async function OrdersLayout({ children }) {
  const returnTo = (await headers()).get('x-return-to') ?? '/orders'; // set by src/proxy.js
  await requireUser(returnTo);
  return children;
}
