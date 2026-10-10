'use client';

import { useEffect, useState } from 'react';

// Returns `value` only after it has stopped changing for `delay` ms.
// Typing "doro" fast = ONE request for "doro", not four (d, do, dor, doro).
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t); // a new keystroke cancels the pending update
  }, [value, delay]);

  return debounced;
}
