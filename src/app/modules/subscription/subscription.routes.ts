import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { subscriptionController } from "./subscription.controller";
import {
  checkoutSubscriptionZod,
  createSubscriptionPlanZod,
  toggleAutoRenewalZod,
  updateSubscriptionPlanZod,
} from "./subscription.validation";

const subscriptionPlanRoutes = Router();
const subscriptionRoutes = Router();

subscriptionPlanRoutes.get("/", subscriptionController.getPlans);
subscriptionPlanRoutes.post(
  "/",
  authorize(UserRole.ADMIN),
  validate(createSubscriptionPlanZod),
  subscriptionController.createPlan
);
subscriptionPlanRoutes.put(
  "/:planId",
  authorize(UserRole.ADMIN),
  validate(updateSubscriptionPlanZod),
  subscriptionController.updatePlan
);

subscriptionRoutes.get(
  "/me",
  authorize(UserRole.COACH, UserRole.SCOUT),
  subscriptionController.getMySubscription
);
subscriptionRoutes.post(
  "/checkout",
  authorize(UserRole.COACH, UserRole.SCOUT),
  validate(checkoutSubscriptionZod),
  subscriptionController.checkout
);
subscriptionRoutes.post(
  "/:subscriptionId/confirm-payment",
  authorize(UserRole.COACH, UserRole.SCOUT),
  subscriptionController.confirmPayment
);
subscriptionRoutes.patch(
  "/:subscriptionId/auto-renewal",
  authorize(UserRole.COACH, UserRole.SCOUT),
  validate(toggleAutoRenewalZod),
  subscriptionController.setAutoRenewal
);

export { subscriptionRoutes, subscriptionPlanRoutes };
