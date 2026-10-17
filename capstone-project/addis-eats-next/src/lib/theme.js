'use client';

import { useSyncExternalStore } from 'react';

// The current theme lives on <html data-theme="light|dark">. It's set before the
// first paint by THEME_SCRIPT (in layout.js), from the saved choice or the device
// setting. Components read it with useTheme(); the button changes it with setTheme().

import { THEME_KEY } from './themeScript';

function subscribe(onChange) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // No saved choice yet? Follow the device when it switches (e.g. at sunset).
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystem = () => {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {}
    if (!saved) document.documentElement.dataset.theme = media.matches ? 'dark' : 'light';
  };
  media.addEventListener('change', onSystem);
  return () => {
    observer.disconnect();
    media.removeEventListener('change', onSystem);
  };
}

/** 'light' | 'dark' in the browser; null during server rendering (unknown there). */
export function useTheme() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme ?? 'light',
    () => null
  );
}

export function setTheme(theme) {
  const root = document.documentElement;
  root.classList.add('theme-switching'); // smooth colour change, only for this switch
  root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  window.setTimeout(() => root.classList.remove('theme-switching'), 300);
}
