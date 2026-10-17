'use client';

import { useActionState, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import PasswordField from '../PasswordField';
import { changeName, changePassword, logOutEverywhere } from './actions';

export function NameForm({ name, locked }) {
  const [state, action, pending] = useActionState(changeName, { name });
  const { mutate } = useSWRConfig();
  useEffect(() => {
    if (state.ok) mutate('/api/session'); // the header shows the new name
  }, [state, mutate]);
  return (
    <form action={action} className="account-form">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" className="form-control" defaultValue={state.name ?? name} disabled={locked} autoComplete="name"
          aria-invalid={state.fieldErrors?.name ? 'true' : undefined} aria-describedby={state.fieldErrors?.name ? 'name-error' : undefined} />
        {state.fieldErrors?.name && <span id="name-error" className="error-text">{state.fieldErrors.name[0]}</span>}
      </div>
      <Result state={state} />
      {!locked && <button type="submit" className="btn btn-secondary" disabled={pending}>{pending ? 'Saving…' : 'Save name'}</button>}
    </form>
  );
}

export function PasswordForm({ locked }) {
  const [state, action, pending] = useActionState(changePassword, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="account-form" key={state.ok ? 'done' : 'form'}>
      <PasswordField id="currentPassword" label="Current password" autoComplete="current-password" error={e.currentPassword?.[0]} disabled={locked} />
      <PasswordField id="newPassword" label="New password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={e.newPassword?.[0]} disabled={locked} />
      <Result state={state} />
      <button type="submit" className="btn btn-secondary" disabled={pending || locked}>{pending ? 'Changing…' : 'Change password'}</button>
    </form>
  );
}

export function LogOutEverywhereButton({ devices }) {
  const [state, action, pending] = useActionState(async () => (await logOutEverywhere()) ?? null, null);
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!window.confirm('Log out of Addis Eats on every device, including this one?')) ev.preventDefault();
      }}
    >
      <button type="submit" className="btn btn-quiet btn-danger" disabled={pending}>
        {pending ? 'Logging out…' : `Log out of all devices${devices > 1 ? ` (${devices})` : ''}`}
      </button>
      {state?.error && <span role="alert" className="error-text">{state.error}</span>}
    </form>
  );
}

function Result({ state }) {
  if (state.error) return <p role="alert" className="notice notice-error">{state.error}</p>;
  if (state.ok && state.message) return <p role="status" className="notice notice-success">{state.message}</p>;
  return null;
}
