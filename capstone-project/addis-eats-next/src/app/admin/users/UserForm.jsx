'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import PasswordField from '../../PasswordField';
import { ROLES, ROLE_LABELS } from '@/lib/roles';
import { adminCreateUser, adminUpdateUser } from '../actions';

function Err({ id, errors }) {
  return errors?.[id] ? <span id={`${id}-error`} className="error-text">{errors[id][0]}</span> : null;
}
const a11y = (id, errors) => ({
  'aria-invalid': errors?.[id] ? 'true' : undefined,
  'aria-describedby': errors?.[id] ? `${id}-error` : undefined,
});

export default function UserForm({ user }) {
  const [state, formAction, pending] = useActionState(user ? adminUpdateUser : adminCreateUser, {
    values: user ?? { role: 'customer' },
    fieldErrors: {},
    error: '',
  });
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="card admin-form narrow-form" noValidate aria-busy={pending}>
      {user && <input type="hidden" name="id" value={user.id} />}
      {state.error && <p role="alert" className="notice notice-error">{state.error}</p>}

      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" className="form-control" defaultValue={v.name} autoComplete="off" {...a11y('name', e)} />
        <Err id="name" errors={e} />
      </div>
      {user ? (
        <p className="field-hint">Email (the login): <strong>{user.email}</strong></p>
      ) : (
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="form-control" defaultValue={v.email} autoComplete="off" {...a11y('email', e)} />
          <Err id="email" errors={e} />
        </div>
      )}
      <div className="form-group">
        <label htmlFor="role">Role</label>
        <select id="role" name="role" className="form-control" defaultValue={v.role} key={`role-${v.role}`} {...a11y('role', e)}>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <span className="field-hint">Kitchen staff: kitchen board and dashboard. Admin: everything, including this panel.</span>
        <Err id="role" errors={e} />
      </div>
      <PasswordField
        id="password"
        label={user ? 'New password (leave empty to keep the current one)' : 'Password'}
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        error={e.password?.[0]}
      />

      <div className="admin-form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Saving…' : user ? 'Save changes' : 'Create account'}
        </button>
        <Link href="/admin/users" className="btn btn-quiet">Cancel</Link>
      </div>
    </form>
  );
}
