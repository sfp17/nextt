import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// ImageResponse (Satori) can't read .woff2, so the OG images use .woff copies of
// the same DM Sans font the site uses. Read from disk at build/request time.
export async function ogFonts() {
  const dir = join(process.cwd(), 'src/assets/og');
  const [medium, extraBold] = await Promise.all([
    readFile(join(dir, 'DMSans-Medium.woff')),
    readFile(join(dir, 'DMSans-ExtraBold.woff')),
  ]);
  return [
    { name: 'DM Sans', data: medium, weight: 500, style: 'normal' },
    { name: 'DM Sans', data: extraBold, weight: 800, style: 'normal' },
  ];
}

/** A public/ image as a data: URL, so Satori can embed it without an HTTP request. */
export async function publicImageDataUrl(publicPath) {
  const buf = await readFile(join(process.cwd(), 'public', publicPath));
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}
