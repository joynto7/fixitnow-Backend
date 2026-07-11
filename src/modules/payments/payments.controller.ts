import { Request, Response } from 'express';

// Placeholder until the payments module is implemented (see payments.routes.ts).
export const stripeWebhookHandler = (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Stripe webhook placeholder', data: null });
};
