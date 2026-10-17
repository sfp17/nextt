import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession, safeNext } from '@/lib/session';
import SignInForm from './SignInForm';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to your Addis Eats account to check out and track your orders.',
  robots: { index: false, follow: false },
};

export default async function SignInPage({ searchParams }) {
  const { next: rawNext } = await searchParams;
  // Validate on the way IN as well: a crafted ?next=https://evil.com becomes "/".
  const next = safeNext(rawNext);

  // Already signed in? Skip the form and go straight to the destination.
  // Not during the sign-in itself (a server-action request): then the form
  // navigates and updates the header in the same moment (useSignedIn.js).
  const duringSignIn = (await headers()).has('next-action');
  if (!duringSignIn && (await getSession())) redirect(next);

  return (
    <div className="auth-page">
      <div className="page-head">
        <h1>Sign in</h1>
        <p>{next !== '/' ? 'Sign in to continue where you left off.' : 'Welcome back to Addis Eats.'}</p>
      </div>

      <SignInForm next={next} />

      <div className="card card-muted" style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
        <strong>Demo accounts for class</strong>
        <table className="demo-accounts">
          <tbody>
            <tr><td>abebe@addiseats.et</td><td><code>injera123</code></td><td>customer</td></tr>
            <tr><td>sara@addiseats.et</td><td><code>buna1234</code></td><td>customer</td></tr>
            <tr><td>kitchen@addiseats.et</td><td><code>berbere99</code></td><td>staff</td></tr>
            <tr><td>admin@addiseats.et</td><td><code>admin2026</code></td><td>admin</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
