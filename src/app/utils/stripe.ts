import Stripe from "stripe";
import config from "../config";
import ApiError from "../classes/ApiError";

const stripeSecret = config.payment.secret_key;

export const stripe = new Stripe(stripeSecret || "invalid", {
  apiVersion: "2026-01-28.clover",
});

export const createStripePaymentIntent = async (
  amountInCents: number,
  currency: string,
  metadata: Record<string, string>
) => {
  if (!stripeSecret) {
    throw new ApiError(500, "STRIPE_SECRET_KEY is not configured");
  }
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
  if (!stripeSecret) {
    throw new ApiError(500, "STRIPE_SECRET_KEY is not configured");
  }
  return stripe.paymentIntents.retrieve(paymentIntentId);
};
