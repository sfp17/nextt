'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { isAdmin } from '@/lib/roles';
import { createDish, updateDish, deleteDish, resetMenu } from '@/lib/menu';
import { createOrder, setOrderStatus, updateOrderDetails, deleteOrder, ADMIN_STATUSES } from '@/lib/orders';
import { createUser, updateUser, deleteUser, getUserById } from '@/lib/users';
import { orderSchema } from '@/lib/schema';
import { dishSchema, orderDetailsSchema, userSchema, passwordSchema, emailSchema } from '@/lib/adminSchema';

// Every admin action checks the role ITSELF. Server actions are public POST
// endpoints: the /admin layout, the proxy and the hidden nav link protect
// nothing on their own (AUTH.md). A customer calling one gets 403.
async function requireAdmin() {
  const session = await getSession();
  if (!session) return { denied: { ok: false, status: 401, error: 'Please sign in.' } };
  if (!isAdmin(session.user.role)) return { denied: { ok: false, status: 403, error: 'Admins only.' } };
  return { admin: session.user };
}

const errorsOf = (result) => result.error.flatten().fieldErrors;
const done = (section, what, name) => redirect(`/admin/${section}?done=${what}&name=${encodeURIComponent(name)}`);

// After any menu change, every page that shows dishes is rebuilt on its next visit.
function refreshMenuPages(id) {
  revalidatePath('/');
  revalidatePath('/menu');
  revalidatePath('/sitemap.xml');
  if (id) revalidatePath(`/menu/${id}`);
}

// ---------------------------------------------------------------- menu

export async function saveDish(prevState, formData) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const id = formData.get('id') ? String(formData.get('id')) : null;
  const values = {
    name: String(formData.get('name') ?? ''),
    price: String(formData.get('price') ?? ''),
    category: String(formData.get('category') ?? ''),
    desc: String(formData.get('desc') ?? ''),
    image: String(formData.get('image') ?? ''),
    imageAlt: String(formData.get('imageAlt') ?? ''),
    available: formData.get('available') === 'on',
  };
  const parsed = dishSchema.safeParse(values);
  if (!parsed.success) return { ok: false, values, fieldErrors: errorsOf(parsed), error: 'Please fix the highlighted fields.' };

  const dish = id ? await updateDish(id, parsed.data) : await createDish(parsed.data);
  if (!dish) return { ok: false, values, fieldErrors: {}, error: 'That dish no longer exists.' };
  refreshMenuPages(dish.id);
  done('menu', id ? 'updated' : 'created', dish.name);
}

export async function removeDish(id) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  await deleteDish(String(id));
  refreshMenuPages(String(id));
  done('menu', 'deleted', `Dish ${id}`);
}

export async function toggleDish(id, available) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  await updateDish(String(id), { available: Boolean(available) });
  refreshMenuPages(String(id));
  revalidatePath('/admin/menu');
  return { ok: true };
}

export async function resetMenuToCode() {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  await resetMenu();
  refreshMenuPages();
  done('menu', 'reset', 'Menu');
}

// ---------------------------------------------------------------- orders

export async function adminCreateOrder(prevState, formData) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const items = [];
  for (const [key, value] of formData.entries()) {
    const qty = Number(value);
    if (key.startsWith('qty_') && qty > 0) items.push({ dishId: key.slice(4), quantity: qty });
  }
  const values = {
    ownerId: String(formData.get('ownerId') ?? ''),
    fullName: String(formData.get('fullName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    neighbourhood: String(formData.get('neighbourhood') ?? ''),
    address: String(formData.get('address') ?? ''),
  };
  // Same rules as a customer's checkout, including "every dish must be on the menu".
  const parsed = await orderSchema.safeParseAsync({ ...values, items });
  if (!parsed.success) return { ok: false, values, fieldErrors: errorsOf(parsed), error: 'Please fix the highlighted fields.' };
  if (values.ownerId && !(await getUserById(values.ownerId))) {
    return { ok: false, values, fieldErrors: { ownerId: ['That customer no longer exists.'] }, error: 'Please fix the highlighted fields.' };
  }
  const order = await createOrder({ ...parsed.data, ownerId: values.ownerId || null });
  revalidatePath('/admin/orders');
  done('orders', 'created', order.id);
}

export async function adminUpdateOrder(prevState, formData) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const values = {
    status,
    fullName: String(formData.get('fullName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    neighbourhood: String(formData.get('neighbourhood') ?? ''),
    address: String(formData.get('address') ?? ''),
  };
  const parsed = orderDetailsSchema.safeParse(values);
  const fieldErrors = parsed.success ? {} : errorsOf(parsed);
  if (!ADMIN_STATUSES.includes(status)) fieldErrors.status = ['Choose a status'];
  if (Object.keys(fieldErrors).length) return { ok: false, values, fieldErrors, error: 'Please fix the highlighted fields.' };

  if (!(await updateOrderDetails(id, parsed.data))) return { ok: false, values, fieldErrors: {}, error: 'That order no longer exists.' };
  await setOrderStatus(id, status);
  revalidatePath('/admin/orders');
  done('orders', 'updated', id);
}

export async function quickSetStatus(id, status) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const order = await setOrderStatus(String(id), String(status));
  revalidatePath('/admin/orders');
  return order ? { ok: true, status: order.status } : { ok: false, error: 'Order not found' };
}

export async function removeOrder(id) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  await deleteOrder(String(id));
  revalidatePath('/admin/orders');
  done('orders', 'deleted', String(id));
}

// ---------------------------------------------------------------- users

export async function adminCreateUser(prevState, formData) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const values = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    role: String(formData.get('role') ?? ''),
  };
  const fieldErrors = {};
  const base = userSchema.safeParse(values);
  if (!base.success) Object.assign(fieldErrors, errorsOf(base));
  const email = emailSchema.safeParse(values.email);
  if (!email.success) fieldErrors.email = [email.error.issues[0].message];
  const password = passwordSchema.safeParse(String(formData.get('password') ?? ''));
  if (!password.success) fieldErrors.password = [password.error.issues[0].message];
  if (Object.keys(fieldErrors).length) return { ok: false, values, fieldErrors, error: 'Please fix the highlighted fields.' };

  const { user, error } = await createUser({ name: base.data.name, email: email.data, password: password.data, role: base.data.role });
  if (error) return { ok: false, values, fieldErrors: { email: ['An account with this email already exists.'] }, error: '' };
  revalidatePath('/admin/users');
  done('users', 'created', user.name);
}

export async function adminUpdateUser(prevState, formData) {
  const { denied, admin } = await requireAdmin();
  if (denied) return denied;
  const id = String(formData.get('id') ?? '');
  const values = { name: String(formData.get('name') ?? ''), role: String(formData.get('role') ?? '') };
  const fieldErrors = {};
  const base = userSchema.safeParse(values);
  if (!base.success) Object.assign(fieldErrors, errorsOf(base));
  const rawPassword = String(formData.get('password') ?? '');
  let password = null;
  if (rawPassword) {
    const p = passwordSchema.safeParse(rawPassword);
    if (p.success) password = p.data;
    else fieldErrors.password = [p.error.issues[0].message];
  }
  // You can't remove your own admin rights (and lock everyone out of /admin).
  if (id === admin.id && base.success && base.data.role !== 'admin') fieldErrors.role = ['You can’t remove your own admin role.'];
  if (Object.keys(fieldErrors).length) return { ok: false, values, fieldErrors, error: 'Please fix the highlighted fields.' };

  const { user, error } = await updateUser(id, { ...base.data, password });
  if (error === 'built-in') return { ok: false, values, fieldErrors: {}, error: 'Built-in demo accounts can’t be changed.' };
  if (error) return { ok: false, values, fieldErrors: {}, error: 'That account no longer exists.' };
  revalidatePath('/admin/users');
  done('users', 'updated', user.name);
}

export async function removeUser(id) {
  const { denied, admin } = await requireAdmin();
  if (denied) return denied;
  if (String(id) === admin.id) return { ok: false, error: 'You can’t delete your own account here.' };
  const { error } = await deleteUser(String(id));
  if (error === 'built-in') return { ok: false, error: 'Built-in demo accounts can’t be deleted.' };
  revalidatePath('/admin/users');
  done('users', 'deleted', 'Account');
}
