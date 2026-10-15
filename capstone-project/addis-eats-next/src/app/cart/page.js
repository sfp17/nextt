import CartView from './CartView';

// page.js is a server file so it can export metadata;
// the interactive cart lives in the client component CartView.
export const metadata = {
  title: 'Your Cart',
  description: 'Review the dishes in your Addis Eats cart, change quantities and continue to checkout.',
  robots: { index: false, follow: false }, // a personal, empty-to-crawlers page
};

export default function CartPage() {
  return <CartView />;
}
