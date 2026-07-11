import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking id'),
    provider: z.enum(['STRIPE', 'SSLCOMMERZ']),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking id'),
  }),
});

export const paymentIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid payment id') }),
});
