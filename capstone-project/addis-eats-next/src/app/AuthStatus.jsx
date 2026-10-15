'use client';

import { useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { signOutAction } from './actions';
import NavLink from './NavLink';

// Header auth links. This is DISPLAY ONLY — hiding "Kitchen" from customers
// is a convenience, not security. /kitchen checks the role on the server.
export default function AuthStatus() {
  const pathname = usePathname();
  const [isSigningOut, startSignOut] = useTransition();
  const { data, mutate } = useSWR('/api/session', fetcher, { revalidateOnFocus: true });

  // Sign-in/out changes the cookie on the server; re-check after each navigation.
  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  const user = data?.user;

  if (!user) {
    return pathname === '/signin' ? null : (
      <Link href={`/signin?next=${encodeURIComponent(pathname)}`} className="nav-cta">Sign in</Link>
    );
  }

  return (
    <>
      {user.role === 'staff' && <NavLink href="/kitchen">Kitchen</NavLink>}
      {user.role === 'staff' && <NavLink href="/dashboard">Dashboard</NavLink>}
      <NavLink href="/orders">My orders</NavLink>
      <button
        type="button"
        className="nav-link nav-button"
        disabled={isSigningOut}
        title={`Signed in as ${user.name}`}
        onClick={() =>
          startSignOut(async () => {
            mutate({ user: null }, { revalidate: false }); // update header right away
            await signOutAction(); // deletes the server session + cookie, redirects home
          })
        }
      >
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </button>
    </>
  );
}
