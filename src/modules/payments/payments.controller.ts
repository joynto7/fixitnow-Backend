import { Request, Response } from 'express';
import Stripe from 'stripe';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as paymentService from './payments.service';
import { constructStripeWebhookEvent } from './providers/stripe.provider';

export const createPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.createPayment(req.user!.id, req.body);
  sendSuccess(res, 201, 'Payment session created', result);
});

export const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.confirmPayment(req.body.bookingId);
  sendSuccess(res, 200, 'Payment confirmed', payment);
});

export const getPayments = catchAsync(async (req: Request, res: Response) => {
  const payments = await paymentService.listPaymentsForUser(req.user!.id, req.user!.role);
  sendSuccess(res, 200, 'Payments fetched', payments);
});

export const getPayment = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.getPaymentForUser(req.params.id, req.user!);
  sendSuccess(res, 200, 'Payment fetched', payment);
});

export const stripeReturn = catchAsync(async (req: Request, res: Response) => {
  const sessionId = req.query.session_id as string | undefined;
  if (!sessionId) {
    throw new AppError(400, 'Missing session_id query parameter');
  }
  const result = await paymentService.handleStripeReturn(sessionId);
  sendSuccess(res, result.success ? 200 : 402, result.message, null);
});

// Mounted before express.json() with a raw body parser (see app.ts) so the
// Stripe signature can be verified against the exact bytes Stripe sent.
export const stripeWebhookHandler = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  if (!signature || Array.isArray(signature)) {
    throw new AppError(400, 'Missing Stripe-Signature header');
  }
  const event: Stripe.Event = constructStripeWebhookEvent(req.body as Buffer, signature);
  await paymentService.handleStripeWebhookEvent(event);
  res.status(200).json({ received: true });
});

export const sslcommerzSuccess = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body } as Record<string, unknown>;
  const payment = await paymentService.handleSslcommerzCallback(payload);
  sendSuccess(res, 200, 'Payment successful', payment);
});

export const sslcommerzFail = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body } as Record<string, unknown>;
  await paymentService.handleSslcommerzFailureCallback(payload);
  sendSuccess(res, 200, 'Payment failed', null);
});

export const sslcommerzCancel = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body } as Record<string, unknown>;
  await paymentService.handleSslcommerzFailureCallback(payload);
  sendSuccess(res, 200, 'Payment cancelled', null);
});

export const sslcommerzIpn = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body } as Record<string, unknown>;
  await paymentService.handleSslcommerzCallback(payload);
  res.status(200).json({ received: true });
});
