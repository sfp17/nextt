// One place for the site's identity and its public URL.
export const SITE_NAME = 'Addis Eats';

/**
 * The absolute origin used for canonical links, og:url, og:image, the sitemap
 * and robots.txt. Social previews only work with ABSOLUTE URLs.
 *   1. NEXT_PUBLIC_SITE_URL if you set it (e.g. a custom domain)
 *   2. on Vercel production: the project's production domain (set by Vercel)
 *   3. on a Vercel preview: that deployment's own URL (set by Vercel)
 *   4. locally: http://localhost:3000
 */
function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export const SITE_URL = resolveSiteUrl().replace(/\/$/, '');
export const SITE_DESCRIPTION =
  'Order authentic Ethiopian food online in Addis Ababa — doro wat, beyaynetu, tibs, burgers and pizza, cooked fresh and delivered fast.';

export const absoluteUrl = (path = '/') => new URL(path, SITE_URL).toString();

// Next.js REPLACES (doesn't merge) a nested object like `openGraph` when a page
// sets its own. Pages spread these defaults so they keep og:type, locale,
// site name and the large Twitter card.
export const baseOpenGraph = { type: 'website', siteName: SITE_NAME, locale: 'en_US' };
export const baseTwitter = { card: 'summary_large_image' };
