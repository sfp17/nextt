import './globals.css';
import localFont from 'next/font/local';
import Link from 'next/link';
import Providers from './providers';
import CartLink from './CartLink';
import NavLink from './NavLink';
import AuthStatus from './AuthStatus';
import ThirdPartyScripts from './ThirdPartyScripts';
import AttackConsole from './AttackConsole';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, baseOpenGraph, baseTwitter } from '@/lib/site';

// Self-hosted: the .woff2 ships with the app and is served from our own
// domain. No request to fonts.googleapis.com, no render-blocking stylesheet.
// next/font also generates a size-adjusted Arial fallback, so swapping to the
// real font doesn't move the text (this removed the CLS, see PERF.md).
const dmSans = localFont({
  src: './fonts/DMSans-Variable.woff2',
  weight: '100 1000', // one variable file covers every weight
  style: 'normal',
  display: 'swap',
  variable: '--font-sans',
});

// Headings: Bricolage Grotesque, self-hosted the same way. Trimmed with
// fonttools to Latin characters and the 600-800 weights headings use:
// 41 KB -> ~24 KB. Its size-adjusted fallback keeps CLS at 0 (see PERF.md).
const bricolage = localFont({
  src: './fonts/BricolageGrotesque-Variable.woff2',
  weight: '600 800',
  style: 'normal',
  display: 'swap',
  variable: '--font-display',
  // Kept preloaded (the default). Measured: turning preload off made LCP worse,
  // because the big hero headline repaints when the font arrives late.
});

export const metadata = {
  // Every relative URL in metadata (og:image, canonical, og:url) is resolved
  // against this, so crawlers and link previews get ABSOLUTE URLs.
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Addis Eats — Authentic Ethiopian Food Delivered in Addis Ababa', // pages with no title
    template: '%s | Addis Eats', // pages that set title: 'Menu' → "Menu | Addis Eats"
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: baseOpenGraph, // no url here: each public page sets its own
  twitter: baseTwitter, // summary_large_image: big preview image when the link is shared
};

export default function RootLayout({ children }) {

  return (
    <html lang="en" className={`${dmSans.variable} ${bricolage.variable}`}>
      <body>
        <Providers>
          <header className="site-header">
            <div className="header-inner">
              <Link href="/" className="brand-logo" aria-label="Addis Eats home">
                <span className="brand-mark" aria-hidden="true" />
                Addis Eats
              </Link>
              <nav className="nav-links" aria-label="Main">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/menu">Menu</NavLink>
                <CartLink />
                <AuthStatus />
              </nav>
            </div>
            <div className="mesob" aria-hidden="true" />
          </header>

          <main className="main-container">{children}</main>

          <footer className="site-footer">
            <div className="mesob" aria-hidden="true" />
            <div className="footer-inner">
              <div>
                <p className="footer-brand">Addis Eats</p>
                <p>Ethiopian favourites, burgers and pizza, delivered across Addis Ababa.</p>
              </div>
              <nav aria-label="Footer">
                <ul className="footer-links">
                  <li><Link href="/menu">Menu</Link></li>
                  <li><Link href="/cart">Cart</Link></li>
                  <li><Link href="/orders">My orders</Link></li>
                </ul>
              </nav>
              <p className="footer-small">© 2026 Addis Eats Software PLC</p>
            </div>
          </footer>
        </Providers>
        <ThirdPartyScripts />
        <AttackConsole />
      </body>
    </html>
  );
}