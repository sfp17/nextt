import Image from 'next/image';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';
import { DISH_IMAGE_WIDTH, DISH_IMAGE_HEIGHT } from '@/lib/dishes';
import { etb } from '@/lib/format';

// How wide a card image is actually drawn at each screen width, worked out from
// the CSS (globals.css): page padding 16px under 721px and 24px above; grid gap
// 20px; 1 column under 640px, 2 from 640px, 3 from 960px; content max 1052px.
// The browser uses this to pick the smallest srcset file that still looks sharp.
export const CARD_SIZES = [
  '(max-width: 639px) calc(100vw - 32px)', //       1 column
  '(max-width: 720px) calc((100vw - 52px) / 2)', // 2 columns, 16px padding
  '(max-width: 959px) calc((100vw - 68px) / 2)', // 2 columns, 24px padding
  '(max-width: 1100px) calc((100vw - 88px) / 3)', // 3 columns
  '338px', //                                       3 columns at max width: (1052 - 40) / 3
].join(', ');

export default function DishCard({ dish, sizes = CARD_SIZES, priority = false }) {
  return (
    <article className="dish-card">
      <Link href={`/menu/${dish.id}`} className="dish-card-media" tabIndex={-1} aria-hidden="true">
        <Image
          src={dish.image}
          alt={dish.imageAlt}
          // Real intrinsic size of the file: the browser reserves the 4:3 box
          // before the image arrives, so nothing below it jumps (CLS).
          width={DISH_IMAGE_WIDTH}
          height={DISH_IMAGE_HEIGHT}
          sizes={sizes}
          // Only ever true for the ONE largest above-the-fold image on a page
          // (the first card on menu page 1). `preload` puts a <link> in <head>,
          // so the download starts before the browser reaches the card. We
          // measured this against fetchPriority="high": preload won (PERF.md).
          preload={priority}
          className="dish-photo"
        />
      </Link>
      <div className="dish-card-body">
        <div className="dish-card-top">
          <h3 className="dish-card-title">
            <Link href={`/menu/${dish.id}`}>{dish.name}</Link>
          </h3>
          <span className="price">
            {etb(dish.price, { unit: false })}
            <small>ETB</small>
          </span>
        </div>
        <p className="dish-card-desc">{dish.desc}</p>
        <div className="dish-card-actions">
          <Link href={`/menu/${dish.id}`} className="btn btn-quiet" aria-label={`Details for ${dish.name}`}>
            Details
          </Link>
          <AddToCartButton dish={dish} className="add-btn" />
        </div>
      </div>
    </article>
  );
}
