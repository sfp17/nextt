import { requireUser, countSessions } from '@/lib/session';
import { isBuiltIn } from '@/lib/users';
import { ROLE_LABELS } from '@/lib/roles';
import { when } from '@/lib/format';
import LogoutButton from '../LogoutButton';
import { NameForm, PasswordForm, LogOutEverywhereButton } from './AccountForms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your account', robots: { index: false, follow: false } };

export default async function AccountPage() {
  const { user } = await requireUser('/account');
  const locked = isBuiltIn(user.id);
  const devices = await countSessions(user.id);

  return (
    <div className="narrow account-page">
      <div className="page-head">
        <h1>Your account</h1>
        <p>{user.email} · <span className={`role-pill role-${user.role}`}>{ROLE_LABELS[user.role]}</span>{user.createdAt ? ` · member since ${when(user.createdAt)}` : ''}</p>
      </div>
      {locked && (
        <p className="notice" role="note">
          This is a built-in demo account for class, so its name and password can&apos;t be changed. Create your own
          account at Sign up to try these settings.
        </p>
      )}

      <section className="card account-section" aria-labelledby="profile-h">
        <h2 id="profile-h">Profile</h2>
        <NameForm name={user.name} locked={locked} />
      </section>

      <section className="card account-section" aria-labelledby="pw-h">
        <h2 id="pw-h">Password</h2>
        <p className="muted">Changing it logs out every other device that is signed in to your account.</p>
        <PasswordForm locked={locked} />
      </section>

      <section className="card account-section" aria-labelledby="out-h">
        <h2 id="out-h">Log out</h2>
        <p className="muted">
          Signed in on <strong>{devices}</strong> device{devices === 1 ? '' : 's'}. Logging out deletes the session on our
          server, so the browser can&apos;t be used to get back in, even with a copied cookie.
        </p>
        <div className="account-out">
          <LogoutButton className="btn btn-primary">Log out</LogoutButton>
          <LogOutEverywhereButton devices={devices} />
        </div>
      </section>
    </div>
  );
}
