import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import validate from "../../middlewares/validate";
import { bookingApprovalRequestController } from "./bookingApprovalRequest.controller";
import { updateBookingApprovalStatusZod } from "./bookingApprovalRequest.validation";

const router = Router();

router.get(
  "/",
  authorize(UserRole.PARENT),
  bookingApprovalRequestController.getAll
);

router.put(
  "/:requestId/status",
  authorize(UserRole.PARENT),
  validate(updateBookingApprovalStatusZod),
  bookingApprovalRequestController.updateStatus
);

export const bookingApprovalRequestRoutes = router;
