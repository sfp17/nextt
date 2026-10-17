import Link from 'next/link';
import { listUsers } from '@/lib/users';
import { getSession } from '@/lib/session';
import { ROLE_LABELS } from '@/lib/roles';
import { when } from '@/lib/format';
import { removeUser } from '../actions';
import ConfirmAction from '../ConfirmAction';
import Notice from '../Notice';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Users' };

export default async function AdminUsers({ searchParams }) {
  const { done, name } = await searchParams;
  const [users, session] = await Promise.all([listUsers(), getSession()]);

  return (
    <>
      <div className="admin-row">
        <h1 className="admin-title">Users <span className="admin-count">{users.length} accounts</span></h1>
        <Link href="/admin/users/new" className="btn btn-primary">+ Add user</Link>
      </div>
      <Notice done={done} name={name} />

      <div className="table-scroll">
        <table className="data-table admin-table">
          <caption className="visually-hidden">Every account</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Created</th>
              <th scope="col"><span className="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <th scope="row">
                  {u.name}
                  {u.id === session?.user.id && <small className="muted"> (you)</small>}
                </th>
                <td>{u.email}</td>
                <td><span className={`role-pill role-${u.role}`}>{ROLE_LABELS[u.role]}</span></td>
                <td>{u.builtIn ? <span className="muted">Built-in demo account</span> : u.createdAt ? when(u.createdAt) : '—'}</td>
                <td className="admin-actions">
                  {u.builtIn ? (
                    <span className="muted" title="Defined in code (lib/users.js)">Read-only</span>
                  ) : (
                    <>
                      <Link href={`/admin/users/${u.id}`} className="btn btn-secondary">Edit</Link>
                      {u.id !== session?.user.id && (
                        <ConfirmAction action={removeUser.bind(null, u.id)} label="Delete" confirm={`Delete ${u.name}'s account? They will be signed out everywhere.`} pendingLabel="Deleting…" />
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-help">
        The four demo accounts are defined in code so the class demo always works; they can&apos;t be edited here.
        Deleting an account signs that person out at once; their past orders stay for the kitchen&apos;s records.
      </p>
    </>
  );
}
