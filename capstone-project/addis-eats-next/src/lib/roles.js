// Roles, in one place (safe for client components too: no secrets here).
//   customer  order and track their own food
//   staff     + kitchen board and dashboard
//   admin     + everything in /admin (menu, orders, users)
export const ROLES = ['customer', 'staff', 'admin'];
export const ROLE_LABELS = { customer: 'Customer', staff: 'Kitchen staff', admin: 'Admin' };

export const isStaff = (role) => role === 'staff' || role === 'admin';
export const isAdmin = (role) => role === 'admin';
