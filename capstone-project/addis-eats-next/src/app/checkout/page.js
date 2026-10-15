import { requireUser } from '@/lib/session';
import { randomUUID } from 'node:crypto';
import OrderForm from './OrderForm';

export const metadata = {
  title: 'Checkout',
  description: 'Enter your delivery details and place your Addis Eats order.',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  // Layer 2 (page): the proxy only saw that A cookie exists; this verifies it
  // maps to a real session. Signed-out or forged → /signin?next=/checkout.
  // Layer 3 is in the write itself: placeOrder() re-checks the session and
  // takes the order's owner from it (src/app/actions.js).
  const { user } = await requireUser('/checkout');
  // A fresh key for every render of the form. Every submit of THIS form carries
  // it, so the server can tell "the same order sent twice" from "a new order".
  return <OrderForm idempotencyKey={randomUUID()} defaultName={user.name} />;
}
