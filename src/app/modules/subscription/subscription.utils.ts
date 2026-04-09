import Stripe from "stripe";
import {
  PaymentStatus,
  SubscriptionStatus,
  UserRole,
} from "@prisma/client";

export const toDate = (unixSeconds?: number | null) =>
  unixSeconds ? new Date(unixSeconds * 1000) : null;

export const isSupportedSubscriptionRole = (
  role: UserRole
): role is "COACH" | "SCOUT" =>
  role === UserRole.COACH || role === UserRole.SCOUT;

export const getStripeSubscriptionPeriod = (
  subscription: Stripe.Subscription
) => {
  const stripeSubscription = subscription as any;
  const item = stripeSubscription.items?.data?.[0];

  return {
    currentPeriodStart: toDate(
      item?.current_period_start ?? stripeSubscription.current_period_start
    ),
    currentPeriodEnd: toDate(
      item?.current_period_end ?? stripeSubscription.current_period_end
    ),
  };
};

export const getInvoiceSubscriptionId = (invoice: Stripe.Invoice) => {
  const rawInvoice = invoice as any;
  return typeof rawInvoice.subscription === "string"
    ? rawInvoice.subscription
    : rawInvoice.subscription?.id;
};

export const getInvoicePaymentIntentId = (invoice: Stripe.Invoice) => {
  const rawInvoice = invoice as any;
  return typeof rawInvoice.payment_intent === "string"
    ? rawInvoice.payment_intent
    : rawInvoice.payment_intent?.id;
};

export const getLatestInvoicePaymentIntent = (
  invoice?: Stripe.Invoice | null
) => {
  if (!invoice) return null;
  const rawInvoice = invoice as any;
  return (rawInvoice.payment_intent ?? null) as Stripe.PaymentIntent | null;
};

export const mapStripeSubscriptionStatus = (
  status: Stripe.Subscription.Status
): SubscriptionStatus => {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete_expired":
      return "EXPIRED";
    case "incomplete":
    default:
      return "INCOMPLETE";
  }
};

export const mapStripePaymentIntentStatus = (
  status?: Stripe.PaymentIntent.Status
): PaymentStatus => {
  switch (status) {
    case "succeeded":
      return "SUCCEEDED";
    case "canceled":
      return "CANCELED";
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
    case "processing":
    default:
      return "PENDING";
  }
};
