'use client';

import { useTransition } from 'react';
import { useSWRConfig } from 'swr';
import { signOutAction } from './actions';

/**
 * Log out of THIS browser. Used in the header account menu, the admin panel
 * and /account. The server deletes the session (a copied cookie stops working),
 * then sends you to the home page with "You are signed out".
 */
export default function LogoutButton({ className = 'btn btn-secondary', children = 'Log out' }) {
  const [pending, start] = useTransition();
  const { mutate } = useSWRConfig();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          mutate('/api/session', { user: null }, { revalidate: false }); // header switches at once
          await signOutAction();
        })
      }
    >
      {pending ? 'Logging out…' : children}
    </button>
  );
}
