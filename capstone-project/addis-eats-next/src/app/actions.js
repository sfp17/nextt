'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { orderSchema } from '@/lib/schema';
import { placeOrderOnce, getOrderForOwner, getOrder, markCancelled, markDelivered } from '@/lib/orders';
import { getSession, destroySession } from '@/lib/session';
import { isStaff } from '@/lib/roles';

// Every action re-checks the session itself. Server actions are public POST
// endpoints — the proxy and the page that shows the button are NOT protection.

export async function placeOrder(prevState, formData) {
  const session = await getSession();
  if (!session) {
    return { success: false, fieldErrors: {}, values: {}, message: 'Your session has expired. Please sign in again.', needsSignIn: true };
  }

  let items = [];
  try {
    const parsed = JSON.parse(formData.get('items') ?? '[]');
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    items = [];
  }

  const values = {
    fullName: String(formData.get('fullName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    neighbourhood: String(formData.get('neighbourhood') ?? ''),
    address: String(formData.get('address') ?? ''),
  };

  const validated = await orderSchema.safeParseAsync({ ...values, items });

  if (!validated.success) {
    const fieldErrors = validated.error.flatten().fieldErrors;
    return {
      success: false,
      fieldErrors,
      values,
      message: fieldErrors.items
        ? 'There is a problem with the items in your cart.'
        : 'Please correct the highlighted fields.',
    };
  }

  // Owner comes from the SESSION, never from the form. The idempotency key does
  // come from the form, but it is scoped to this user (lib/orders.js).
  const { order } = await placeOrderOnce({
    ...validated.data,
    ownerId: session.user.id,
    idempotencyKey: String(formData.get('idempotencyKey') ?? '').slice(0, 64),
  });
  if (!order) {
    return { success: false, fieldErrors: {}, values, message: 'Your order is still being placed. Check My orders before trying again.' };
  }

  return { success: true, orderId: order.id, message: 'Order successfully placed!' };
}

export async function cancelOrder(orderId) {
  const session = await getSession();
  if (!session) {
    return { success: false, status: 401, error: 'Please sign in.' };
  }

  // Ownership is part of the lookup: someone else's order → "not found".
  const order = await getOrderForOwner(String(orderId), session.user.id);
  if (!order) {
    return { success: false, status: 404, error: 'Order not found' };
  }

  if (order.status !== 'placed') {
    return { success: false, status: 409, error: 'This order is already being prepared and can no longer be cancelled.' };
  }

  await markCancelled(order.id);
  return { success: true, status: 200, message: `Order ${order.id} successfully cancelled.` };
}

/** Staff only. Role is checked HERE, not just by hiding the button. */
export async function markOrderDelivered(orderId) {
  const session = await getSession();
  if (!session) return { success: false, status: 401, error: 'Please sign in.' };
  if (!isStaff(session.user.role)) return { success: false, status: 403, error: 'Staff only.' };

  const order = await getOrder(String(orderId));
  if (!order) return { success: false, status: 404, error: 'Order not found' };
  if (order.status === 'cancelled') return { success: false, status: 409, error: 'Order was cancelled.' };

  await markDelivered(order.id);
  return { success: true, status: 200 };
}

export async function signOutAction() {
  await destroySession();
  (await cookies()).set('ae_flash', 'signed-out', { path: '/', maxAge: 60, sameSite: 'lax' });
  redirect('/');
}
