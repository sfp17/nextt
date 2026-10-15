/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // AVIF first (roughly 30-50% smaller than WebP for photos), WebP for
    // browsers without AVIF. next/image picks per request via the Accept header.
    formats: ['image/avif', 'image/webp'],
    // Only the widths this layout can use. Cards are 338-760 CSS px wide (up to 2x
    // on retina) and every photo file is 1200-1280 px, so 32-128 px thumbnails and
    // 1920-3840 px versions (bigger than the files themselves) were dead weight in
    // every srcset. Trimming them cut /menu's HTML, which also lets React send the
    // menu inline instead of streaming it after the shell (PERF.md).
    deviceSizes: [640, 750, 828, 1080, 1280],
    imageSizes: [384],
  },
  // Sent with every response. Cheap protections the pre-flight check asks for:
  //   nosniff         browsers must trust our Content-Type, not guess
  //   Referrer-Policy order URLs (/track/ORD-…) aren't leaked to other sites in full
  //   frame-ancestors nobody can put Addis Eats in a hidden iframe (clickjacking)
  //   Permissions     we never ask for the camera, microphone or location
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
