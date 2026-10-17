import { absoluteUrl, SITE_URL } from '@/lib/site';

// Crawlers may index the public menu; private, per-user pages are off-limits.
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/cart', '/checkout', '/orders', '/kitchen', '/dashboard', '/admin', '/account', '/track', '/signin', '/signup', '/api/'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
