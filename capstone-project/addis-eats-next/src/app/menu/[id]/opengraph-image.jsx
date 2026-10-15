import { ImageResponse } from 'next/og';
import { getDish } from '@/lib/dishes';
import { etb } from '@/lib/format';
import { ogFonts, publicImageDataUrl } from '@/lib/ogFonts';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Lets each dish's image have its OWN alt text (og:image:alt), from the data.
export async function generateImageMetadata({ params }) {
  const { id } = await params;
  const dish = getDish(id);
  return [
    {
      id: 'card',
      alt: dish ? `${dish.name}, ${etb(dish.price)} at Addis Eats — ${dish.imageAlt}` : 'Addis Eats dish',
      size,
      contentType,
    },
  ];
}

export default async function DishOpengraphImage({ params }) {
  const { id } = await params;
  const dish = getDish(id);
  const fonts = await ogFonts();

  if (!dish) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#f1c40f', fontSize: 64, fontFamily: 'DM Sans', fontWeight: 800 }}>Addis Eats</div>,
      { ...size, fonts }
    );
  }

  const photo = await publicImageDataUrl(dish.image);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', fontFamily: 'DM Sans', background: '#fcfbfa' }}>
        <img src={photo} alt="" width={630} height={630} style={{ objectFit: 'cover' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 56px 52px', width: 570 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#c0392b', letterSpacing: 1 }}>Addis Eats</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: 2 }}>{dish.category}</div>
            <div style={{ fontSize: dish.name.length > 18 ? 54 : 68, fontWeight: 800, color: '#2c3e50', lineHeight: 1.05, marginTop: 8 }}>{dish.name}</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: '#4b5563', marginTop: 18, lineHeight: 1.35 }}>
              {dish.desc.length > 110 ? `${dish.desc.slice(0, 107)}…` : dish.desc}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#c0392b' }}>{etb(dish.price)}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#fff', background: '#1a1a1a', padding: '10px 20px', borderRadius: 40 }}>Order online</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
