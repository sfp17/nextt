import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AddToCartButton from '../AddToCartButton';
import { dishes, getDish, DISH_IMAGE_WIDTH, DISH_IMAGE_HEIGHT } from '@/lib/dishes';
import { dishSummary, menuItemJsonLd, jsonLdString } from '@/lib/dishSeo';
import { baseOpenGraph, baseTwitter } from '@/lib/site';
import { etb } from '@/lib/format';

// Only the dishes returned below exist. Any other ID (e.g. a removed dish)
// gets a real 404 status, not a 200 page that says "not found".
export const dynamicParams = false;

export async function generateStaticParams() {
  return dishes.map((dish) => ({ id: dish.id }));
}

// Title, description and social preview text come from the dish record itself.
// The og:image is NOT set here: ./opengraph-image.jsx generates it per dish.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const dish = getDish(id);
  if (!dish) return { title: 'Dish not found', robots: { index: false } };

  const title = `${dish.name} — ${etb(dish.price)}`; // → "Doro Wat — 350 ETB | Addis Eats"
  const description = dishSummary(dish);

  return {
    title,
    description,
    alternates: { canonical: `/menu/${dish.id}` },
    openGraph: {
      ...baseOpenGraph,
      title: `${dish.name} · ${etb(dish.price)}`,
      description,
      url: `/menu/${dish.id}`,
    },
    twitter: { ...baseTwitter, title: `${dish.name} · ${etb(dish.price)}`, description },
  };
}

export default async function DishDetailPage({ params }) {
  const { id } = await params;
  const dish = getDish(id);

  if (!dish) {
    notFound();
  }

  return (
    <>
      {/* Structured data from the same `dish` object rendered below. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(menuItemJsonLd(dish)) }} />

      <Link href="/menu" className="back-link">← Back to the menu</Link>

      <article className="dish-detail">
        {/* The only large image on this page (its LCP), so it gets preload. */}
        <div className="dish-detail-photo">
          <Image
            src={dish.image}
            alt={dish.imageAlt}
            width={DISH_IMAGE_WIDTH}
            height={DISH_IMAGE_HEIGHT}
            // full width below 901px; above that the photo column is 1.15 of 2.15
            // parts of (content width - 40px gap), max (1052 - 40) * 0.535 = 542px
            sizes="(max-width: 720px) calc(100vw - 32px), (max-width: 900px) calc(100vw - 48px), (max-width: 1100px) calc((100vw - 88px) * 0.535), 542px"
            preload
          />
        </div>

        <div>
          <span className="tag">{dish.category}</span>
          <h1 style={{ margin: '0.6rem 0 0.4rem' }}>{dish.name}</h1>
          <p className="price" style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>
            {etb(dish.price, { unit: false })}
            <small>ETB</small>
          </p>
          <p style={{ fontSize: '1.08rem', color: 'var(--ink-soft)', marginBottom: '1.75rem', maxWidth: '48ch' }}>{dish.desc}</p>
          <AddToCartButton dish={dish} className="btn-block" />
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)', marginTop: '0.9rem' }}>
            Cooked when you order. You can change quantities in your cart.
          </p>
        </div>
      </article>
    </>
  );
}
