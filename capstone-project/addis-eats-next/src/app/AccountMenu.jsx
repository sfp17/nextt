'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROLE_LABELS, isAdmin, isStaff } from '@/lib/roles';
import LogoutButton from './LogoutButton';

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

/**
 * Who is signed in, and the way out. Like most real sites: your initials in the
 * header open a small panel with your name, role, your pages and "Log out".
 * On phones the same panel is simply shown inside the hamburger menu.
 *
 * Disclosure pattern: a real <button> with aria-expanded; Escape closes it and
 * returns focus; a click outside or following a link closes it.
 */
export default function AccountMenu({ user }) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === pathname; // closes by itself after navigating
  const panelId = useId();
  const buttonRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenOn(null);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpenOn(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className="account" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="account-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpenOn(open ? null : pathname)}
      >
        <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
        <span className="account-first">{user.name.split(' ')[0]}</span>
        <svg className="caret" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        <span className="visually-hidden">Account menu</span>
      </button>

      <div id={panelId} className={`account-panel${open ? ' is-open' : ''}`}>
        <div className="account-who">
          <span className="avatar avatar-lg" aria-hidden="true">{initials(user.name)}</span>
          <span>
            <strong>{user.name}</strong>
            {user.email && <span className="account-email">{user.email}</span>}
            <span className={`role-pill role-${user.role}`}>{ROLE_LABELS[user.role] ?? user.role}</span>
          </span>
        </div>
        <ul className="account-links">
          <li><Link href="/account">Account settings</Link></li>
          {isStaff(user.role) && <li><Link href="/kitchen">Kitchen board</Link></li>}
          {isStaff(user.role) && <li><Link href="/dashboard">Dashboard</Link></li>}
          {isAdmin(user.role) && <li><Link href="/admin">Admin panel</Link></li>}
        </ul>
        <LogoutButton className="btn btn-secondary btn-block account-logout" />
      </div>
    </div>
  );
}
