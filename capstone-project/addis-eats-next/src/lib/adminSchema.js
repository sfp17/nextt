import { z } from 'zod';
import { NEIGHBOURHOODS } from './neighbourhoods';
import { ROLES } from './roles';

// Everything an admin form sends is checked here, on the server, the same way
// a customer's checkout is. An admin is trusted to make decisions, not to send
// well-formed data.

export const dishSchema = z.object({
  name: z.string().trim().min(2, 'Name: at least 2 characters').max(60),
  price: z.coerce.number({ error: 'Price must be a number' }).int('Whole birr only').min(1, 'Price must be at least 1 ETB').max(100000),
  category: z.enum(['ethiopian', 'burgers', 'pizza', 'sides', 'drinks'], { error: 'Choose a category' }),
  desc: z.string().trim().min(10, 'Description: at least 10 characters').max(300),
  image: z.string().regex(/^\/images\/dishes\/[\w-]+\.(jpg|jpeg|png|webp)$/, 'Choose a photo from the list'),
  imageAlt: z.string().trim().min(5, 'Describe the photo for people who can’t see it').max(200),
  available: z.boolean(),
});

const phone = z.string().trim().regex(/^(?:\+251|0)9\d{8}$/, 'Ethiopian mobile number, e.g. 0911223344');

export const orderDetailsSchema = z.object({
  fullName: z.string().trim().min(2, 'Name: at least 2 characters'),
  phone,
  neighbourhood: z.enum(NEIGHBOURHOODS, { error: 'Choose a neighbourhood' }),
  address: z.string().trim().min(5, 'Address: at least 5 characters'),
});

export const userSchema = z.object({
  name: z.string().trim().min(2, 'Name: at least 2 characters').max(60),
  role: z.enum(ROLES, { error: 'Choose a role' }),
});

export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), 'At least one letter and one number');

export const emailSchema = z.string().trim().toLowerCase().max(120).pipe(z.email('Enter a valid email address'));
