'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signIn } from './actions';
import PasswordField from '../PasswordField';
import { useSignedIn } from '../useSignedIn';

export default function SignInForm({ next }) {
  const [state, formAction, isPending] = useActionState(signIn, { error: '', email: '' });
  useSignedIn(state);

  if (state.success) {
    // Shown for a moment while the next page loads (or, without JavaScript, as a link).
    return (
      <div className="card" role="status">
        <p>Signed in as <strong>{state.user.name}</strong>. Taking you back…</p>
        <Link href={state.next} className="btn btn-primary" style={{ marginTop: '0.75rem' }}>Continue</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="card">
      {/* Where to go after sign-in. Re-validated on the server. */}
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <div role="alert" className="notice notice-error" style={{ marginBottom: '1.1rem' }}>
          {state.error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="form-control" autoComplete="email" defaultValue={state.email} required />
      </div>

      <PasswordField autoComplete="current-password" required />

      <button type="submit" className="btn btn-primary btn-block" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="form-footnote">
        New to Addis Eats?{' '}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="inline-link">Create an account</Link>
      </p>
    </form>
  );
}
