'use server';

import { redirect } from 'next/navigation';
import { authenticate, normaliseEmail } from '@/lib/users';
import { rateLimit } from '@/lib/rateLimit';
import { createSession, safeNext } from '@/lib/session';

export async function signIn(prevState, formData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next')); // validated AGAIN here — the form field is user input too

  if (!email || !password) {
    return { error: 'Enter your email and password.', email };
  }

  // At most 8 wrong passwords per email per 15 minutes, counted across all servers.
  // Stops someone from trying thousands of passwords against one account.
  const limit = await rateLimit(`signin:${normaliseEmail(email)}`, { max: 8, windowSeconds: 15 * 60 });
  if (!limit.ok) {
    return { error: `Too many attempts for this account. Try again in ${limit.retryMinutes} minute${limit.retryMinutes === 1 ? '' : 's'}.`, email };
  }

  const user = await authenticate(email, password);
  if (!user) {
    await limit.hit();
    // Same message for wrong email and wrong password — don't reveal which accounts exist.
    return { error: 'Incorrect email or password.', email };
  }
  await limit.reset();

  await createSession(user.id);
  redirect(next); // must be outside try/catch — redirect() works by throwing
}
