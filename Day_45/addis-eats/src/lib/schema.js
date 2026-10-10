import { z } from 'zod';
import { getDish } from './dishes';

export const orderSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().trim().regex(/^(?:\+251|0)9\d{8}$/, 'Must be a valid Ethiopian phone number (e.g. 0911223344)'),
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
