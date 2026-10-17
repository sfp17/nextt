import { getMenu } from '@/lib/menu';
import { listUsers } from '@/lib/users';
import OrderForm from '../OrderForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New order' };

export default async function NewOrder() {
  const [dishes, users] = await Promise.all([getMenu(), listUsers()]);
  const customers = users.filter((u) => u.role === 'customer').map(({ id, name, email }) => ({ id, name, email }));
  return (
    <>
      <h1 className="admin-title">New order</h1>
      <p className="admin-help">For phone orders. Prices come from the menu on the server, as at checkout.</p>
      <OrderForm customers={customers} dishes={dishes.map(({ id, name, price }) => ({ id, name, price }))} />
    </>
  );
}
