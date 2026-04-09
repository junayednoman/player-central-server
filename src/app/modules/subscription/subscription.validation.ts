import z from "zod";
import { UserRole } from "@prisma/client";

const subscriptionRoles = [UserRole.COACH, UserRole.SCOUT] as const;

export const createSubscriptionPlanZod = z.object({
  role: z.enum(subscriptionRoles),
  name: z.string().min(1).trim(),
  price: z.number().positive(),
  currency: z.string().min(3).trim().toLowerCase().default("usd"),
  features: z.array(z.string().min(1).trim()).min(1),
  isActive: z.boolean().optional(),
});

export const updateSubscriptionPlanZod = z.object({
  name: z.string().min(1).trim().optional(),
  price: z.number().positive().optional(),
  currency: z.string().min(3).trim().toLowerCase().optional(),
  features: z.array(z.string().min(1).trim()).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const checkoutSubscriptionZod = z.object({
  planId: z.string().uuid(),
});

export const toggleAutoRenewalZod = z.object({
  autoRenewal: z.boolean(),
});

export type TCreateSubscriptionPlan = z.infer<
  typeof createSubscriptionPlanZod
>;
export type TUpdateSubscriptionPlan = z.infer<
  typeof updateSubscriptionPlanZod
>;
export type TCheckoutSubscription = z.infer<typeof checkoutSubscriptionZod>;
export type TToggleAutoRenewal = z.infer<typeof toggleAutoRenewalZod>;
