'use server';

import { redirect } from 'next/navigation';
import { authenticate } from '@/lib/users';
import { createSession, safeNext } from '@/lib/session';

export async function signIn(prevState, formData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next')); // validated AGAIN here — the form field is user input too

  if (!email || !password) {
    return { error: 'Enter your email and password.', email };
  }

  const user = authenticate(email, password);
  if (!user) {
    // Same message for wrong email and wrong password — don't reveal which accounts exist.
    return { error: 'Incorrect email or password.', email };
  }

  await createSession(user.id);
  redirect(next); // must be outside try/catch — redirect() works by throwing
}
