'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

// One-time messages after a server redirect ("Welcome, Hanna"), carried by a
// short-lived cookie the server sets (ae_flash). Only a fixed CODE travels in
// the cookie; the text is chosen here, so nothing from a cookie is ever shown as-is.
const MESSAGES = {
  welcome: (name) => `Welcome to Addis Eats${name ? `, ${name.split(' ')[0]}` : ''}! Your account is ready. Pick something to eat.`,
  'signed-out': () => 'You are logged out. See you soon!',
  'signed-out-all': () => 'You are logged out on every device.',
};

function readFlash() {
  const match = document.cookie.match(/(?:^|;\s*)ae_flash=([^;]+)/);
  if (!match) return null;
  document.cookie = 'ae_flash=; Max-Age=0; path=/'; // show it once
  return MESSAGES[match[1]] ? match[1] : null;
}

export default function Toaster() {
  const [code, setCode] = useState(null);
  const { data } = useSWR('/api/session', fetcher); // shared with the header: no extra request
  const pathname = usePathname();

  // After every page change (sign-up and sign-out redirect to a new page), look for a message.
  useEffect(() => {
    const t = setTimeout(() => {
      const found = readFlash();
      if (found) setCode(found);
    }, 0);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!code) return;
    const t = setTimeout(() => setCode(null), 7000);
    return () => clearTimeout(t);
  }, [code]);

  return (
    // The live region is always in the page, so screen readers announce the text when it appears.
    <div className="toast-region" role="status" aria-live="polite">
      {code && (
        <div className="toast">
          <span>{MESSAGES[code](data?.user?.name)}</span>
          <button type="button" className="toast-close" onClick={() => setCode(null)} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
