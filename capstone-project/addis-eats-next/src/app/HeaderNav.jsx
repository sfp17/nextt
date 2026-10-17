'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * The main navigation. On wide screens it's a plain row of links. On phones
 * (≤ 760 px, see globals.css) it folds behind a hamburger button that opens a
 * panel below the header.
 *
 * Accessible disclosure pattern:
 *  - a real <button> with aria-expanded and aria-controls (Enter / Space)
 *  - Escape closes it and puts focus back on the button
 *  - a click or tap outside closes it
 *  - it closes by itself after you follow a link (the page changes)
 *  - focus isn't trapped: it's a menu of links, not a dialog
 */
export default function HeaderNav({ children, tools = null }) {
  const pathname = usePathname();
  // Remember WHICH page the menu was opened on: navigating changes the page, so it's closed again.
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === pathname;
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
    <div className="header-nav" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpenOn(open ? null : pathname)}
      >
        <span className={`hamburger${open ? ' is-open' : ''}`} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="visually-hidden">{open ? 'Close navigation' : 'Open navigation'}</span>
      </button>
      <nav id="site-nav" className={`nav-links${open ? ' is-open' : ''}`} aria-label="Main">
        {children}
      </nav>
      {tools && <div className="header-tools">{tools}</div>}
      {/* Without JavaScript the button can't open anything, so show the links instead. */}
      <noscript>
        <style>{'.nav-toggle{display:none!important}.nav-links{display:flex!important;position:static!important}'}</style>
      </noscript>
    </div>
  );
}
