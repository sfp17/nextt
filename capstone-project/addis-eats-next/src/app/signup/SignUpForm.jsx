'use client';

import { useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { signUp } from './actions';
import PasswordField from '../PasswordField';
import { useSignedIn } from '../useSignedIn';

export default function SignUpForm({ next }) {
  const [state, formAction, isPending] = useActionState(signUp, { values: {}, fieldErrors: {}, error: '' });
  const sent = useRef(false);
  const errors = state.fieldErrors ?? {};
  useSignedIn(state);
  useEffect(() => {
    if (!isPending) sent.current = false; // an error came back: allow the corrected form
  }, [isPending]);

  if (state.success) {
    return (
      <div className="card" role="status">
        <p>Your account is ready, <strong>{state.user.name}</strong>. Taking you to the menu…</p>
        <Link href={state.next} className="btn btn-primary" style={{ marginTop: '0.75rem' }}>Continue</Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="card"
      noValidate
      aria-busy={isPending}
      onSubmit={(e) => {
        if (sent.current) e.preventDefault(); // a double tap creates one account, not an error
        sent.current = true;
      }}
    >
      <input type="hidden" name="next" value={next} />

      {(state.error || state.emailTaken) && (
        <div role="alert" className="notice notice-error" style={{ marginBottom: '1.1rem' }}>
          {state.error || 'That email already has an account.'}
          {state.emailTaken && (
            <>
              {' '}
              <Link href={`/signin?next=${encodeURIComponent(next)}`} className="inline-link">Sign in instead</Link>
            </>
          )}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" type="text" className="form-control" autoComplete="name" required
          defaultValue={state.values?.name} aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={errors.name ? 'name-error' : undefined} />
        {errors.name && <span id="name-error" className="error-text">{errors.name[0]}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" inputMode="email" className="form-control" autoComplete="email" required
          autoCapitalize="none" spellCheck={false}
          defaultValue={state.values?.email} aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined} />
        {errors.email && <span id="email-error" className="error-text">{errors.email[0]}</span>}
      </div>

      <PasswordField
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters, with a letter and a number."
        error={errors.password?.[0]}
      />

      <button type="submit" className="btn btn-primary btn-block" disabled={isPending}>
        {isPending ? 'Creating your account…' : 'Create account'}
      </button>
      <p className="form-footnote">
        Already have an account? <Link href={`/signin?next=${encodeURIComponent(next)}`} className="inline-link">Sign in</Link>
      </p>
    </form>
  );
}
