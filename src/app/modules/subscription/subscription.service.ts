import Stripe from "stripe";
import { PaymentStatus, PaymentType, Prisma, UserRole } from "@prisma/client";
import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  constructStripeWebhookEvent,
  createStripeCustomer,
  createStripeProduct,
  createStripeRecurringPrice,
  createStripeSubscription,
  deactivateStripePrice,
  retrieveStripePaymentIntent,
  retrieveStripeSubscription,
  setStripeSubscriptionAutoRenewal,
  updateStripeProduct,
} from "../../utils/stripe";
import {
  TCheckoutSubscription,
  TCreateSubscriptionPlan,
  TToggleAutoRenewal,
  TUpdateSubscriptionPlan,
} from "./subscription.validation";
import {
  getInvoicePaymentIntentId,
  getInvoiceSubscriptionId,
  getLatestInvoicePaymentIntent,
  getStripeSubscriptionPeriod,
  isSupportedSubscriptionRole,
  mapStripePaymentIntentStatus,
  mapStripeSubscriptionStatus,
} from "./subscription.utils";

const getPlans = async (role?: string) => {
  const where: Prisma.SubscriptionPlanWhereInput = {
    isActive: true,
    ...(role ? { role: role as UserRole } : {}),
  };

  return prisma.subscriptionPlan.findMany({
    where,
    orderBy: [{ role: "asc" }, { price: "asc" }, { createdAt: "desc" }],
  });
};

const createPlan = async (payload: TCreateSubscriptionPlan) => {
  const product = await createStripeProduct(payload.name);
  const price = await createStripeRecurringPrice(
    product.id,
    Math.round(payload.price * 100),
    payload.currency
  );

  return prisma.subscriptionPlan.create({
    data: {
      role: payload.role,
      name: payload.name,
      price: payload.price,
      currency: payload.currency,
      features: payload.features,
      isActive: payload.isActive ?? true,
      stripeProductId: product.id,
      stripePriceId: price.id,
    },
  });
};

const updatePlan = async (planId: string, payload: TUpdateSubscriptionPlan) => {
  const existingPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!existingPlan) throw new ApiError(404, "Subscription plan not found");

  const nextName = payload.name ?? existingPlan.name;
  const nextPrice = payload.price ?? existingPlan.price;
  const nextCurrency = payload.currency ?? existingPlan.currency;

  if (existingPlan.stripeProductId && payload.name) {
    await updateStripeProduct(existingPlan.stripeProductId, nextName);
  }

  let stripePriceId = existingPlan.stripePriceId;
  const priceChanged =
    payload.price !== undefined || payload.currency !== undefined;

  if (priceChanged) {
    if (!existingPlan.stripeProductId) {
      throw new ApiError(400, "Stripe product is missing for this plan");
    }

    const newPrice = await createStripeRecurringPrice(
      existingPlan.stripeProductId,
      Math.round(nextPrice * 100),
      nextCurrency
    );

    if (existingPlan.stripePriceId) {
      await deactivateStripePrice(existingPlan.stripePriceId);
    }

    stripePriceId = newPrice.id;
  }

  return prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.currency !== undefined ? { currency: payload.currency } : {}),
      ...(payload.features !== undefined ? { features: payload.features } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(stripePriceId ? { stripePriceId } : {}),
    },
  });
};

const checkout = async (authId: string, payload: TCheckoutSubscription) => {
  const auth = await prisma.auth.findUnique({
    where: { id: authId },
    select: {
      id: true,
      email: true,
      role: true,
      subscription: true,
    },
  });
  if (!auth) throw new ApiError(404, "User not found");
  if (!isSupportedSubscriptionRole(auth.role)) {
    throw new ApiError(403, "Only coach and scout can subscribe");
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      id: payload.planId,
      role: auth.role,
      isActive: true,
    },
  });
  if (!plan) throw new ApiError(404, "Subscription plan not found");
  if (!plan.stripePriceId) {
    throw new ApiError(400, "Stripe price is not configured for this plan");
  }

  if (
    auth.subscription &&
    ["ACTIVE", "PAST_DUE", "INCOMPLETE"].includes(auth.subscription.status)
  ) {
    throw new ApiError(409, "You already have a subscription in progress");
  }

  const customerId =
    auth.subscription?.providerCustomerId ??
    (
      await createStripeCustomer(auth.email, {
        authId,
        role: auth.role,
      })
    ).id;

  const stripeSubscription = await createStripeSubscription(
    customerId,
    plan.stripePriceId,
    {
      authId,
      planId: plan.id,
      role: auth.role,
    }
  );

  const latestInvoice =
    stripeSubscription.latest_invoice as Stripe.Invoice | null;
  const paymentIntent = getLatestInvoicePaymentIntent(latestInvoice);
  const subscriptionPeriod = getStripeSubscriptionPeriod(stripeSubscription);

  const subscription = await prisma.subscription.upsert({
    where: { authId },
    update: {
      planId: plan.id,
      status: mapStripeSubscriptionStatus(stripeSubscription.status),
      providerCustomerId: customerId,
      providerSubscriptionId: stripeSubscription.id,
      currentPeriodStart: subscriptionPeriod.currentPeriodStart,
      currentPeriodEnd: subscriptionPeriod.currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
    create: {
      authId,
      planId: plan.id,
      status: mapStripeSubscriptionStatus(stripeSubscription.status),
      providerCustomerId: customerId,
      providerSubscriptionId: stripeSubscription.id,
      currentPeriodStart: subscriptionPeriod.currentPeriodStart,
      currentPeriodEnd: subscriptionPeriod.currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });

  if (latestInvoice?.id) {
    await prisma.payment.upsert({
      where: { providerInvoiceId: latestInvoice.id },
      update: {
        subscriptionId: subscription.id,
        payerAuthId: authId,
        type: PaymentType.SUBSCRIPTION,
        amount: (latestInvoice.amount_due ?? 0) / 100,
        currency: latestInvoice.currency ?? plan.currency,
        provider: "stripe",
        providerIntentId: paymentIntent?.id,
        status: mapStripePaymentIntentStatus(paymentIntent?.status),
      },
      create: {
        subscriptionId: subscription.id,
        payerAuthId: authId,
        type: PaymentType.SUBSCRIPTION,
        amount: (latestInvoice.amount_due ?? 0) / 100,
        currency: latestInvoice.currency ?? plan.currency,
        provider: "stripe",
        providerIntentId: paymentIntent?.id,
        providerInvoiceId: latestInvoice.id,
        status: mapStripePaymentIntentStatus(paymentIntent?.status),
      },
    });
  }

  return {
    subscription,
    payment: {
      clientSecret: paymentIntent?.client_secret ?? null,
      paymentIntentId: paymentIntent?.id ?? null,
      amount: plan.price,
      currency: plan.currency,
    },
  };
};

const getMySubscription = async (authId: string) => {
  return prisma.subscription.findUnique({
    where: { authId },
    include: {
      plan: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
};

const confirmPayment = async (authId: string, subscriptionId: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });
  if (!subscription) throw new ApiError(404, "Subscription not found");
  if (subscription.authId !== authId) throw new ApiError(403, "Unauthorized");
  if (!subscription.providerSubscriptionId) {
    throw new ApiError(400, "Stripe subscription is missing");
  }

  const latestPendingPayment = await prisma.payment.findFirst({
    where: {
      subscriptionId,
      type: PaymentType.SUBSCRIPTION,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!latestPendingPayment?.providerIntentId) {
    throw new ApiError(404, "Payment intent not found");
  }

  const intent = await retrieveStripePaymentIntent(
    latestPendingPayment.providerIntentId
  );
  if (intent.status !== "succeeded") {
    throw new ApiError(400, "Payment not completed");
  }

  const stripeSubscription = await retrieveStripeSubscription(
    subscription.providerSubscriptionId
  );
  const latestInvoice =
    stripeSubscription.latest_invoice as Stripe.Invoice | null;
  const subscriptionPeriod = getStripeSubscriptionPeriod(stripeSubscription);

  await prisma.$transaction(async tx => {
    await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: mapStripeSubscriptionStatus(stripeSubscription.status),
        currentPeriodStart: subscriptionPeriod.currentPeriodStart,
        currentPeriodEnd: subscriptionPeriod.currentPeriodEnd,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    if (latestInvoice?.id) {
      await tx.payment.upsert({
        where: { providerInvoiceId: latestInvoice.id },
        update: {
          subscriptionId,
          payerAuthId: authId,
          type: PaymentType.SUBSCRIPTION,
          amount:
            (latestInvoice.amount_paid ?? latestInvoice.amount_due ?? 0) / 100,
          currency: latestInvoice.currency ?? "usd",
          provider: "stripe",
          providerIntentId: intent.id,
          status: "SUCCEEDED",
        },
        create: {
          subscriptionId,
          payerAuthId: authId,
          type: PaymentType.SUBSCRIPTION,
          amount:
            (latestInvoice.amount_paid ?? latestInvoice.amount_due ?? 0) / 100,
          currency: latestInvoice.currency ?? "usd",
          provider: "stripe",
          providerIntentId: intent.id,
          providerInvoiceId: latestInvoice.id,
          status: "SUCCEEDED",
        },
      });
    }
  });

  return {
    paymentConfirmed: true,
    status: mapStripeSubscriptionStatus(stripeSubscription.status),
  };
};

const setAutoRenewal = async (
  authId: string,
  subscriptionId: string,
  payload: TToggleAutoRenewal
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });
  if (!subscription) throw new ApiError(404, "Subscription not found");
  if (subscription.authId !== authId) throw new ApiError(403, "Unauthorized");
  if (!subscription.providerSubscriptionId) {
    throw new ApiError(400, "Stripe subscription is missing");
  }

  const updatedStripeSubscription = await setStripeSubscriptionAutoRenewal(
    subscription.providerSubscriptionId,
    payload.autoRenewal
  );
  const updatedPeriod = getStripeSubscriptionPeriod(updatedStripeSubscription);

  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: mapStripeSubscriptionStatus(updatedStripeSubscription.status),
      currentPeriodStart: updatedPeriod.currentPeriodStart,
      currentPeriodEnd: updatedPeriod.currentPeriodEnd,
      cancelAtPeriodEnd: updatedStripeSubscription.cancel_at_period_end,
    },
    include: {
      plan: true,
    },
  });
};

const syncSubscriptionFromStripe = async (providerSubscriptionId: string) => {
  const localSubscription = await prisma.subscription.findFirst({
    where: { providerSubscriptionId },
  });
  if (!localSubscription) return null;

  const stripeSubscription = await retrieveStripeSubscription(
    providerSubscriptionId
  );
  const subscriptionPeriod = getStripeSubscriptionPeriod(stripeSubscription);

  return prisma.subscription.update({
    where: { id: localSubscription.id },
    data: {
      status: mapStripeSubscriptionStatus(stripeSubscription.status),
      currentPeriodStart: subscriptionPeriod.currentPeriodStart,
      currentPeriodEnd: subscriptionPeriod.currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
};

const upsertInvoicePayment = async (
  invoice: Stripe.Invoice,
  status: PaymentStatus
) => {
  const providerSubscriptionId = getInvoiceSubscriptionId(invoice);
  if (!providerSubscriptionId) return null;

  const subscription = await prisma.subscription.findFirst({
    where: { providerSubscriptionId },
  });
  if (!subscription) return null;

  const paymentIntentId = getInvoicePaymentIntentId(invoice);

  if (!invoice.id) return null;

  return prisma.payment.upsert({
    where: { providerInvoiceId: invoice.id },
    update: {
      subscriptionId: subscription.id,
      payerAuthId: subscription.authId,
      type: PaymentType.SUBSCRIPTION,
      amount: (invoice.amount_paid || invoice.amount_due || 0) / 100,
      currency: invoice.currency ?? "usd",
      provider: "stripe",
      providerIntentId: paymentIntentId,
      status,
    },
    create: {
      subscriptionId: subscription.id,
      payerAuthId: subscription.authId,
      type: PaymentType.SUBSCRIPTION,
      amount: (invoice.amount_paid || invoice.amount_due || 0) / 100,
      currency: invoice.currency ?? "usd",
      provider: "stripe",
      providerIntentId: paymentIntentId,
      providerInvoiceId: invoice.id,
      status,
    },
  });
};

const handleWebhook = async (rawBody: Buffer, signature: string) => {
  const event = constructStripeWebhookEvent(rawBody, signature);

  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      await upsertInvoicePayment(invoice, "SUCCEEDED");
      const providerSubscriptionId = getInvoiceSubscriptionId(invoice);
      if (providerSubscriptionId) {
        await syncSubscriptionFromStripe(providerSubscriptionId);
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await upsertInvoicePayment(invoice, "FAILED");
      const providerSubscriptionId = getInvoiceSubscriptionId(invoice);
      if (providerSubscriptionId) {
        await syncSubscriptionFromStripe(providerSubscriptionId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const stripeSubscription = event.data.object as Stripe.Subscription;
      const localSubscription = await prisma.subscription.findFirst({
        where: { providerSubscriptionId: stripeSubscription.id },
      });
      if (localSubscription) {
        const subscriptionPeriod =
          getStripeSubscriptionPeriod(stripeSubscription);
        await prisma.subscription.update({
          where: { id: localSubscription.id },
          data: {
            status: mapStripeSubscriptionStatus(stripeSubscription.status),
            currentPeriodStart: subscriptionPeriod.currentPeriodStart,
            currentPeriodEnd: subscriptionPeriod.currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          },
        });
      }
      break;
    }
    default:
      break;
  }

  return { received: true };
};

export const subscriptionServices = {
  getPlans,
  createPlan,
  updatePlan,
  checkout,
  getMySubscription,
  confirmPayment,
  setAutoRenewal,
  handleWebhook,
};
