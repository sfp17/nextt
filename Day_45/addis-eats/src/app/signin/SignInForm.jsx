'use client';

import { useActionState } from 'react';
import { signIn } from './actions';

export default function SignInForm({ next }) {
  const [state, formAction, isPending] = useActionState(signIn, { error: '', email: '' });

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

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="form-control" autoComplete="current-password" required />
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
