'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession, destroyAllSessions } from '@/lib/session';
import { changeOwnPassword, renameSelf } from '@/lib/users';
import { passwordSchema } from '@/lib/adminSchema';
import { rateLimit } from '@/lib/rateLimit';

// Your own account. Every action finds "you" from the session cookie, never
// from an id in the form, so nobody can change someone else's account here.

export async function logOutEverywhere() {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Please sign in.' };
  await destroyAllSessions(session.user.id); // every browser and phone, this one too
  (await cookies()).set('ae_flash', 'signed-out-all', { path: '/', maxAge: 60, sameSite: 'lax' });
  redirect('/');
}

export async function changePassword(prevState, formData) {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Your session has expired. Please sign in again.' };

  // The same brute-force limit as sign-in: the "current password" box is a guessing chance too.
  const limit = await rateLimit(`pwchange:${session.user.id}`, { max: 5, windowSeconds: 15 * 60 });
  if (!limit.ok) return { ok: false, error: `Too many attempts. Try again in ${limit.retryMinutes} minutes.` };

  const current = String(formData.get('currentPassword') ?? '');
  const next = passwordSchema.safeParse(String(formData.get('newPassword') ?? ''));
  if (!next.success) return { ok: false, fieldErrors: { newPassword: [next.error.issues[0].message] } };
  if (current === next.data) return { ok: false, fieldErrors: { newPassword: ['Choose a password different from the current one.'] } };

  const result = await changeOwnPassword(session.user.id, current, next.data);
  if (result.error === 'built-in') return { ok: false, error: 'Demo accounts keep their class passwords; create your own account to try this.' };
  if (result.error === 'wrong-password') {
    await limit.hit();
    return { ok: false, fieldErrors: { currentPassword: ['That isn’t your current password.'] } };
  }
  if (result.error) return { ok: false, error: 'Something went wrong. Please try again.' };

  // Anyone else signed in with the old password is logged out; you stay in here.
  const ended = await destroyAllSessions(session.user.id, { keepCurrent: true });
  return { ok: true, message: ended ? `Password changed. ${ended} other device${ended === 1 ? ' was' : 's were'} logged out.` : 'Password changed.' };
}

export async function changeName(prevState, formData) {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Please sign in.' };
  const name = String(formData.get('name') ?? '').trim();
  if (name.length < 2 || name.length > 60) return { ok: false, fieldErrors: { name: ['Use 2–60 characters.'] }, name };
  const result = await renameSelf(session.user.id, name);
  if (result.error === 'built-in') return { ok: false, error: 'Demo accounts can’t be renamed.', name };
  return { ok: true, message: 'Name saved.', name };
}
