'use client';

import { useActionState } from 'react';

/**
 * A button that runs a server action after the user confirms ("Delete Doro Wat?").
 * Shows the server's answer if it refuses (e.g. "Built-in demo accounts can't be deleted").
 */
export default function ConfirmAction({ action, label, confirm, className = 'btn btn-quiet btn-danger', pendingLabel = 'Working…' }) {
  const [state, run, pending] = useActionState(async () => (await action()) ?? null, null);
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className="inline-form"
    >
      <button type="submit" className={className} disabled={pending}>
        {pending ? pendingLabel : label}
      </button>
      {state?.error && <span role="alert" className="error-text">{state.error}</span>}
    </form>
  );
}
