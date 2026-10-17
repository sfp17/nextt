'use client';

import { setTheme, useTheme } from '@/lib/theme';

/**
 * One button: light ⇄ dark. Both icons are always in the HTML and CSS shows the
 * right one from <html data-theme>, so the button is correct from the first paint
 * (the server doesn't know the visitor's theme). The label says what a press DOES.
 */
export default function ThemeToggle() {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={theme ? `Switch to ${next} theme` : 'Switch theme'}
      title={theme ? `Switch to ${next} theme` : 'Switch theme'}
    >
      {/* moon: shown in light mode */}
      <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      {/* sun: shown in dark mode */}
      <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
      </svg>
    </button>
  );
}
