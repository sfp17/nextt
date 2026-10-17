import { getMenu } from '@/lib/menu';
import { absoluteUrl } from '@/lib/site';

// Built from the real dish records: add a dish to lib/dishes.js and it
// appears here automatically, with its own last-modified date.
// Private routes (/cart, /checkout, /orders, /kitchen, /signin) are deliberately absent.
export const revalidate = 3600;

export default async function sitemap() {
  const dishes = await getMenu();
  const newest = dishes.map((d) => d.updatedAt).sort().at(-1); // menu changed when its newest dish did

  return [
    { url: absoluteUrl('/'), lastModified: newest, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/menu'), lastModified: newest, changeFrequency: 'weekly', priority: 0.9 },
    ...dishes.map((dish) => ({
      url: absoluteUrl(`/menu/${dish.id}`),
      lastModified: dish.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
      images: [absoluteUrl(dish.image)],
    })),
  ];
}
