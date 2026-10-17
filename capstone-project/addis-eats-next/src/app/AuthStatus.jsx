'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import NavLink from './NavLink';
import AccountMenu from './AccountMenu';
import { isAdmin, isStaff } from '@/lib/roles';

// Header auth links. This is DISPLAY ONLY — hiding "Kitchen" from customers
// is a convenience, not security. /kitchen checks the role on the server.
export default function AuthStatus() {
  const pathname = usePathname();
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

  // Signed in: the main pages stay in the header; everything about YOUR account
  // (role pages, settings, Log out) is in the account menu.
  return (
    <>
      <NavLink href="/orders">My orders</NavLink>
      {isAdmin(user.role) && <NavLink href="/admin">Admin</NavLink>}
      {!isAdmin(user.role) && isStaff(user.role) && <NavLink href="/kitchen">Kitchen</NavLink>}
      <AccountMenu user={user} />
    </>
  );
}
