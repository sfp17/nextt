import UserForm from '../UserForm';

export const metadata = { title: 'Add user' };

export default function NewUser() {
  return (
    <>
      <h1 className="admin-title">Add a user</h1>
      <UserForm />
    </>
  );
}
