'use client';

import { useState } from 'react';
import Script from 'next/script';

/**
 * Facade for the third-party support chat (PERF.md).
 *
 * The real widget costs ~120 KB and ~800 ms of main-thread work on a slow phone.
 * `lazyOnload` only delayed that cost, it still landed while the page was
 * becoming usable. So we render our OWN lightweight button, and download the
 * real widget only when someone actually clicks it. Visitors who never chat
 * never pay for it.
 */
export default function ChatLauncher({ src }) {
  const [state, setState] = useState('idle'); // idle → loading → ready

  if (state === 'ready') return null; // the widget has rendered its own button

  return (
    <>
      <button
        type="button"
        className="chat-launcher"
        onClick={() => setState('loading')}
        disabled={state === 'loading'}
        aria-label="Open support chat"
      >
        {state === 'loading' ? 'Opening chat…' : 'Chat with us'}
      </button>
      {state !== 'idle' && <Script id="support-chat" src={src} strategy="afterInteractive" onReady={() => setState('ready')} />}
    </>
  );
}
