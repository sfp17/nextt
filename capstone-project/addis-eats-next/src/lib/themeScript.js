// Plain module (no 'use client'), so the server layout can read the script text.
export const THEME_KEY = 'ae-theme';

// Runs in <head> before the page is drawn, so a dark-mode visitor never sees a
// white flash. Kept tiny and wrapped in try: private windows can block localStorage.
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})();`;

