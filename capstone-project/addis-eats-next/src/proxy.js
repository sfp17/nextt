import { NextResponse } from 'next/server';

// Next.js 16 renamed middleware.js → proxy.js (same feature, same place).
//
// Job: a FAST first gate. It only checks that a session cookie is present
// and redirects to /signin (remembering where you were going) if not.
// It does NOT trust the cookie — getSession() on the page/action/route
// re-checks it. A forged cookie gets past here and is rejected there.
export function proxy(request) {
  // Server-action POSTs (e.g. the checkout form) carry a Next-Action header.
  // Redirecting those to an HTML page would crash the form, and the action
  // re-checks the session itself and returns a proper "please sign in"
  // result, so let them through to that check.
  if (request.method === 'POST' && request.headers.has('next-action')) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has('ae_session');

  if (!hasSession) {
    const { pathname, search } = request.nextUrl;
    const signIn = new URL('/signin', request.url);
    signIn.searchParams.set('next', pathname + search);
    return NextResponse.redirect(signIn);
  }

  // Tell the layouts which page was asked for, so if the session turns out to be
  // fake they can send the visitor back to exactly this page after signing in.
  const headers = new Headers(request.headers);
  headers.set('x-return-to', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

// Narrow matcher: runs ONLY on private pages. The menu, home, cart,
// static files and images never pay for it.
export const config = {
  matcher: ['/checkout/:path*', '/orders/:path*', '/kitchen/:path*', '/dashboard/:path*', '/track/:path*', '/admin/:path*'],
};
