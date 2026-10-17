import Image from 'next/image';
import Link from 'next/link';
import { getMenu, getDish } from '@/lib/menu';
import { baseOpenGraph } from '@/lib/site';
import DishCard from './menu/DishCard';

// No `title` here → the layout's default title is used for the home page.
export const metadata = {
  description:
    'Authentic Ethiopian dishes delivered across Addis Ababa. Browse doro wat, beef tibs, beyaynetu, burgers, pizza and more, order online, and track your delivery live.',
  alternates: { canonical: '/' },
  openGraph: { ...baseOpenGraph, url: '/' },
};

// Rebuilt at most hourly, and straight away when an admin changes the menu.
export const revalidate = 3600;

export default async function HomePage() {
  // Pulled from the real menu so names, prices and links always match. If an
  // admin removes one of the usual three, the next dishes on the menu fill in.
  const menu = await getMenu();
  const picked = (await Promise.all(['1', '2', '7'].map((id) => getDish(id)))).filter(Boolean);
  const specials = [...picked, ...menu.filter((d) => !picked.includes(d))].slice(0, 3);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        {/* Background photo. It's the largest thing above the fold (the LCP element),
            so it's the ONLY image on this page with preload (a <link> in <head>, so
            the browser starts downloading it before it even reaches the <body>).
            alt="" because it's decorative: the text on top carries the meaning. */}
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          sizes="(max-width: 720px) calc(100vw - 32px), (max-width: 1100px) calc(100vw - 48px), 1052px"
          preload
          className="hero-bg"
        />
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-content">
          <h1 id="hero-title" className="hero-title">Taste home, delivered hot.</h1>
          <p className="hero-lead">
            Doro wat, beyaynetu, sizzling tibs, burgers and pizza, cooked when you order and brought to your door
            anywhere in Addis Ababa.
          </p>
          <div className="hero-actions">
            <Link href="/menu" className="btn btn-primary hero-btn">Browse the menu</Link>
            <Link href="/orders" className="btn hero-btn hero-btn-ghost">Track my order</Link>
          </div>
          <ul className="hero-facts" aria-label="Why order from Addis Eats">
            <li>{menu.length} dishes on the menu</li>
            <li>Live order tracking</li>
            <li>Delivery across Addis</li>
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="specials-title">
        <div className="section-head">
          <div>
            <h2 id="specials-title">Today&apos;s specials</h2>
            <p>The Ethiopian plates people order most this week.</p>
          </div>
          <Link href="/menu" className="btn btn-secondary">See the full menu</Link>
        </div>
        <div className="dish-grid">
          {specials.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="section-head">
          <h2 id="how-title">How ordering works</h2>
        </div>
        <ol className="steps">
          <li>
            <h3>Pick your dishes</h3>
            <p>Search the menu or filter by Ethiopian, burgers, pizza, sides or drinks, and add what you like to your cart.</p>
          </li>
          <li>
            <h3>Place your order</h3>
            <p>Sign in, add your phone number and delivery address, and confirm. Prices are checked again on our side.</p>
          </li>
          <li>
            <h3>Follow it live</h3>
            <p>Your order page updates every few seconds, from the kitchen to the rider to your door.</p>
          </li>
        </ol>
      </section>
    </>
  );
}
