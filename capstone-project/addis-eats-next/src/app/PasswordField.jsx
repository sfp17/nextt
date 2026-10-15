'use client';

import { useState } from 'react';

/**
 * A password input with a Show / Hide button: on a phone keyboard it's easy to
 * mistype a password you can't see. The toggle is a real <button> (Tab, Enter,
 * Space) with aria-pressed, and it never submits the form.
 */
export default function PasswordField({ id = 'password', label = 'Password', autoComplete, hint, error, ...rest }) {
  const [visible, setVisible] = useState(false);
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          className="form-control"
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          spellCheck={false}
          autoCapitalize="none"
          {...rest}
        />
        <button
          type="button"
          className="password-toggle"
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? 'Hide' : 'Show'}
          <span className="visually-hidden"> password</span>
        </button>
      </div>
      {error && <span id={`${id}-error`} className="error-text">{error}</span>}
      {hint && <span id={`${id}-hint`} className="field-hint">{hint}</span>}
    </div>
  );
}
