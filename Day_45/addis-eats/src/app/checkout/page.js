import { requireUser } from '@/lib/session';
import CheckoutForm from './CheckoutForm';

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
  await requireUser('/checkout');
  return <CheckoutForm />;
}
