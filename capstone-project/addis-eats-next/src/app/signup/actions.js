'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { signUpSchema } from '@/lib/schema';
import { createUser } from '@/lib/users';
import { createSession, safeNext } from '@/lib/session';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export async function signUp(prevState, formData) {
  const values = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
  };
  const next = safeNext(formData.get('next')); // same open-redirect guard as sign-in

  // At most 5 new accounts per IP address per hour: stops scripted mass sign-ups.
  const limit = await rateLimit(`signup:${await clientIp()}`, { max: 5, windowSeconds: 60 * 60 });
  if (!limit.ok) {
    return { values, fieldErrors: {}, error: `Too many new accounts from this network. Try again in ${limit.retryMinutes} minutes.` };
  }

  const parsed = signUpSchema.safeParse({ ...values, password: String(formData.get('password') ?? '') });
  if (!parsed.success) {
    return { values, fieldErrors: parsed.error.flatten().fieldErrors, error: 'Please fix the highlighted fields.' };
  }

  const { user, error } = await createUser(parsed.data);
  if (error === 'email-taken') {
    // Sign-up has to say this (you can't create the account otherwise). The sign-in
    // form still never reveals which emails exist, and the rate limit above slows
    // anyone trying to list them through this form.
    return {
      values,
      fieldErrors: { email: ['An account with this email already exists. Sign in instead?'] },
      error: '',
      emailTaken: true,
    };
  }
  await limit.hit();

  await createSession(user.id); // signed in straight away
  // A one-time, harmless note for the welcome message (read and deleted by the browser).
  (await cookies()).set('ae_flash', 'welcome', { path: '/', maxAge: 60, sameSite: 'lax' });
  const dest = next === '/' ? '/menu' : next;
  if (!(await headers()).has('next-action')) redirect(dest); // no JavaScript: plain server redirect
  return { success: true, next: dest, user: { name: user.name, role: user.role } };
}
