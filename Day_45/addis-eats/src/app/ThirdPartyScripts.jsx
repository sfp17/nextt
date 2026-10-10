import Script from 'next/script';
import ChatLauncher from './ChatLauncher';

// Third-party scripts never block the first paint, and each is optional: if its
// env variable isn't set, nothing is loaded.
// - Support chat: loaded on click via a facade (ChatLauncher). Measured: with
//   lazyOnload its ~800 ms of work still landed inside page load (PERF.md).
// - Analytics: strategy="lazyOnload", after the page has loaded and the browser is idle.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CHAT_WIDGET_SRC = process.env.NEXT_PUBLIC_CHAT_WIDGET_SRC;

export default function ThirdPartyScripts() {
  return (
    <>
      {CHAT_WIDGET_SRC && <ChatLauncher src={CHAT_WIDGET_SRC} />}

      {GA_ID && (
        <>
          <Script id="ga-lib" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
          <Script id="ga-init" strategy="lazyOnload">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}
    </>
  );
}
