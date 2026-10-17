'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';

/**
 * After a successful sign-in or sign-up: tell the header who is signed in
 * (it reads the shared '/api/session' SWR cache) and go to the next page, at
 * the same moment, so "Sign in" never stays on screen.
 */
export function useSignedIn(state) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  useEffect(() => {
    if (!state?.success) return;
    mutate('/api/session', { user: state.user }, { revalidate: false }); // header updates now
    router.replace(state.next); // replace: Back doesn't return to the sign-in form
    router.refresh(); // pages rendered while signed out are fetched again, signed in
  }, [state, mutate, router]);
}
