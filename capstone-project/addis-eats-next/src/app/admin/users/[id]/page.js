import { notFound } from 'next/navigation';
import { getUserById, isBuiltIn } from '@/lib/users';
import UserForm from '../UserForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit user' };

export default async function EditUser({ params }) {
  const { id } = await params;
  const user = isBuiltIn(id) ? null : await getUserById(id); // demo accounts are read-only
  if (!user) notFound();
  return (
    <>
      <h1 className="admin-title">Edit {user.name}</h1>
      <UserForm user={{ id: user.id, name: user.name, email: user.email, role: user.role }} />
    </>
  );
}
