import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import validate from "../../middlewares/validate";
import { challengeApprovalRequestController } from "./challengeApprovalRequest.controller";
import {
  createChallengeApprovalRequestZod,
  updateChallengeApprovalStatusZod,
} from "./challengeApprovalRequest.validation";

const router = Router();

router.get(
  "/",
  authorize(UserRole.PARENT),
  challengeApprovalRequestController.getAll
);

router.post(
  "/",
  authorize(UserRole.PLAYER),
  validate(createChallengeApprovalRequestZod),
  challengeApprovalRequestController.create
);

router.put(
  "/:requestId/status",
  authorize(UserRole.PARENT),
  validate(updateChallengeApprovalStatusZod),
  challengeApprovalRequestController.updateStatus
);

export const challengeApprovalRequestRoutes = router;
