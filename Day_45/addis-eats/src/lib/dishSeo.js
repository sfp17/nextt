import { absoluteUrl, SITE_NAME } from './site';

const CATEGORY_LABEL = { ethiopian: 'Ethiopian', burgers: 'Burgers', pizza: 'Pizza', sides: 'Sides', drinks: 'Drinks' };

/** One-line summary used for <meta description>, og:description and JSON-LD. */
export function dishSummary(dish) {
  return `${dish.desc} ${dish.price} ETB — order ${dish.name} online from ${SITE_NAME} in Addis Ababa.`;
}

/**
 * schema.org MenuItem built from the SAME dish object the page renders,
 * so the structured data can never disagree with what's on screen.
 */
export function menuItemJsonLd(dish) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    '@id': absoluteUrl(`/menu/${dish.id}#menuitem`),
    name: dish.name,
    description: dish.desc,
    url: absoluteUrl(`/menu/${dish.id}`),
    image: absoluteUrl(dish.image),
    offers: {
      '@type': 'Offer',
      price: dish.price.toFixed(2),
      priceCurrency: 'ETB',
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/menu/${dish.id}`),
    },
    ...(dish.vegan ? { suitableForDiet: 'https://schema.org/VeganDiet' } : {}),
    isPartOf: {
      '@type': 'MenuSection',
      name: CATEGORY_LABEL[dish.category] ?? dish.category,
      isPartOf: { '@type': 'Menu', name: `${SITE_NAME} menu`, url: absoluteUrl('/menu') },
    },
  };
}

/**
 * Serialize for a <script type="application/ld+json">. Escaping "<" stops a
 * dish description containing "</script>" from breaking out of the tag (XSS).
 */
export function jsonLdString(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
