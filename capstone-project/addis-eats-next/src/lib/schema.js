import { z } from 'zod';
import { getDish } from './dishes';
import { NEIGHBOURHOODS } from './neighbourhoods';

export const orderSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().trim().regex(/^(?:\+251|0)9\d{8}$/, 'Must be a valid Ethiopian phone number (e.g. 0911223344)'),
  neighbourhood: z.enum(NEIGHBOURHOODS, { error: 'Choose the neighbourhood we deliver to' }),
  address: z.string().trim().min(5, 'Delivery address must be at least 5 characters'),
  items: z
    .array(
      z.object({
        // Reject IDs that aren't on the menu instead of saving a "Dish #99" at 0 ETB.
        dishId: z.string().refine((id) => getDish(id) !== null, 'Unknown dish'),
        quantity: z.number().int().positive().max(20, 'Maximum 20 of one dish per order'),
      })
    )
    .min(1, 'Your cart is empty — add at least one dish'),
});

// Day 49: sign-up. The role is NOT a field: every new account is a customer.
export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name (at least 2 characters)').max(60, 'Keep your name under 60 characters'),
  email: z.string().trim().toLowerCase().max(120, 'Use at most 120 characters').pipe(z.email('Enter a valid email address')),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(128, 'Use at most 128 characters')
    .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), 'Use at least one letter and one number'),
});
