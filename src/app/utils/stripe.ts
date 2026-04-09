import Stripe from "stripe";
import config from "../config";
import ApiError from "../classes/ApiError";

const stripeSecret = config.payment.secret_key;
const stripeWebhookSecret = config.payment.webhook_secret;

export const stripe = new Stripe(stripeSecret || "invalid", {
  apiVersion: "2026-01-28.clover",
});

const ensureStripeConfigured = () => {
  if (!stripeSecret) {
    throw new ApiError(500, "STRIPE_SECRET_KEY is not configured");
  }
};

export const createStripePaymentIntent = async (
  amountInCents: number,
  currency: string,
  metadata: Record<string, string>
) => {
  ensureStripeConfigured();
  if (amountInCents <= 0) {
    throw new ApiError(400, "Payment amount must be greater than 0");
  }

  return stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
};

export const retrieveStripePaymentIntent = async (paymentIntentId: string) => {
  ensureStripeConfigured();
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

export const createStripeProduct = async (name: string) => {
  ensureStripeConfigured();
  return stripe.products.create({ name });
};

export const updateStripeProduct = async (productId: string, name: string) => {
  ensureStripeConfigured();
  return stripe.products.update(productId, { name });
};

export const createStripeRecurringPrice = async (
  productId: string,
  amountInCents: number,
  currency: string
) => {
  ensureStripeConfigured();
  if (amountInCents <= 0) {
    throw new ApiError(400, "Subscription price must be greater than 0");
  }

  return stripe.prices.create({
    product: productId,
    unit_amount: amountInCents,
    currency,
    recurring: {
      interval: "month",
    },
  });
};

export const deactivateStripePrice = async (priceId: string) => {
  ensureStripeConfigured();
  return stripe.prices.update(priceId, { active: false });
};

export const createStripeCustomer = async (
  email: string,
  metadata: Record<string, string>
) => {
  ensureStripeConfigured();
  return stripe.customers.create({
    email,
    metadata,
  });
};

export const createStripeSubscription = async (
  customerId: string,
  priceId: string,
  metadata: Record<string, string>
) => {
  ensureStripeConfigured();
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
    metadata,
  });
};

export const retrieveStripeSubscription = async (subscriptionId: string) => {
  ensureStripeConfigured();
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice.payment_intent"],
  });
};

export const cancelStripeSubscriptionAtPeriodEnd = async (
  subscriptionId: string
) => {
  ensureStripeConfigured();
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
};

export const setStripeSubscriptionAutoRenewal = async (
  subscriptionId: string,
  enabled: boolean
) => {
  ensureStripeConfigured();
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: !enabled,
  });
};

export const constructStripeWebhookEvent = (
  payload: Buffer,
  signature: string
) => {
  ensureStripeConfigured();
  if (!stripeWebhookSecret) {
    throw new ApiError(500, "STRIPE_WEBHOOK_SECRET is not configured");
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    stripeWebhookSecret
  );
};
