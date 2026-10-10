// /menu sets its own openGraph fields (url), and in Next.js a page that sets
// `openGraph` no longer inherits the root's file-based preview image. So the
// menu re-uses the site-wide image explicitly. Dish pages have their own.
export { default, alt, size, contentType } from '../opengraph-image';
