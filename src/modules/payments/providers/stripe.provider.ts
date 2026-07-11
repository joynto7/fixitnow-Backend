import Stripe from 'stripe';
import { config } from '../../../config/env';
import { AppError } from '../../../utils/AppError';

let stripeClient: Stripe | null = null;

const getStripeClient = (): Stripe => {
  if (!config.stripe.secretKey) {
    throw new AppError(500, 'Stripe is not configured on this server (missing STRIPE_SECRET_KEY)');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(config.stripe.secretKey);
  }
  return stripeClient;
};

interface CreateStripeSessionParams {
  transactionId: string;
  amount: number;
  description: string;
  customerEmail: string;
  bookingId: string;
}

export const createStripeCheckoutSession = async (params: CreateStripeSessionParams) => {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: params.description },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: params.bookingId, transactionId: params.transactionId },
    success_url: `${config.baseUrl}/api/payments/stripe/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.baseUrl}/api/payments/stripe/return?session_id={CHECKOUT_SESSION_ID}&cancelled=true`,
  });

  if (!session.url) {
    throw new AppError(502, 'Stripe did not return a checkout URL');
  }

  return { redirectUrl: session.url, sessionId: session.id };
};

export const retrieveStripeSession = async (sessionId: string) => {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId);
};

export const constructStripeWebhookEvent = (payload: Buffer, signature: string): Stripe.Event => {
  const stripe = getStripeClient();
  if (!config.stripe.webhookSecret) {
    throw new AppError(500, 'Stripe webhook secret is not configured (missing STRIPE_WEBHOOK_SECRET)');
  }
  return stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
};
