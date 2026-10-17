import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession, safeNext } from '@/lib/session';
import SignUpForm from './SignUpForm';

export const metadata = {
  title: 'Create an account',
  description: 'Create an Addis Eats account to order and track your food.',
  robots: { index: false, follow: false },
};

export default async function SignUpPage({ searchParams }) {
  const next = safeNext((await searchParams).next);
  const duringSignUp = (await headers()).has('next-action'); // see signin/page.js
  if (!duringSignUp && (await getSession())) redirect(next); // already signed in

  return (
    <div className="auth-page">
      <div className="page-head">
        <h1>Create an account</h1>
        <p>Order in a minute, then follow your food live from our kitchen to your door.</p>
      </div>
      <SignUpForm next={next} />
    </div>
  );
}
