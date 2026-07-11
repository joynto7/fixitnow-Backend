import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('A valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().trim().min(6).max(20).optional(),
    // ADMIN accounts are seeded only, never self-registered.
    role: z.enum(['CUSTOMER', 'TECHNICIAN']).default('CUSTOMER'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('A valid email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});
