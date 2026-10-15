import { ImageResponse } from 'next/og';
import { ogFonts, publicImageDataUrl } from '@/lib/ogFonts';

// Site-wide preview image: used by every page that doesn't make its own
// (home, menu, …). Dish pages override it with app/menu/[id]/opengraph-image.jsx.
export const alt = 'Addis Eats — Taste home, delivered hot: a delivery rider on an Addis Ababa street outside an Addis Eats café';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const hero = await publicImageDataUrl('/images/hero.jpg');

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'DM Sans', background: '#1a1a1a' }}>
        <img src={hero} alt="" width={1260} height={630} style={{ position: 'absolute', left: -30, top: 0, objectFit: 'cover', opacity: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 72px', width: '100%', background: 'linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.75) 50%, rgba(10,10,10,0.2) 100%)' }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#f1c40f', letterSpacing: 1 }}>Addis Eats</div>
          <div style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1.05, marginTop: 10, maxWidth: 700 }}>
            Taste home, delivered hot.
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, color: '#e5e7eb', marginTop: 18, maxWidth: 640 }}>Ethiopian favourites, burgers & pizza across Addis Ababa</div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
