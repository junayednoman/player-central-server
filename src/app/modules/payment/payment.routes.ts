import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { paymentController } from "./payment.controller";
import { UserRole } from "@prisma/client";

const router = Router();

router.get(
  "/transactions",
  authorize(UserRole.ADMIN),
  paymentController.getAllPaymentTransactions
);

router.get(
  "/transactions/total-by-role",
  authorize(UserRole.ADMIN),
  paymentController.getRolePaymentTotal
);

router.get("/coach/:coachId", authorize(), paymentController.getCoachPayments);

router.get(
  "/coach/:coachId/total-earnings",
  authorize(),
  paymentController.getCoachTotalEarnings
);

router.get(
  "/coach/:coachId/monthly-earnings",
  authorize(),
  paymentController.getCoachMonthlyEarnings
);

export const paymentRoutes = router;
