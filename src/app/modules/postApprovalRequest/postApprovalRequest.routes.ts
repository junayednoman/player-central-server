import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import validate from "../../middlewares/validate";
import { postApprovalRequestController } from "./postApprovalRequest.controller";
import { updatePostApprovalStatusZod } from "./postApprovalRequest.validation";

const router = Router();

router.get(
  "/",
  authorize(UserRole.PARENT),
  postApprovalRequestController.getAll
);

router.put(
  "/:requestId/status",
  authorize(UserRole.PARENT),
  validate(updatePostApprovalStatusZod),
  postApprovalRequestController.updateStatus
);

export const postApprovalRequestRoutes = router;
