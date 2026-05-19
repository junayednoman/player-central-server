import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { paymentController } from "./payment.controller";

const router = Router();

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
