import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import { childControllers } from "./child.controller";
import validate from "../../middlewares/validate";
import { updateChildStatusSchema } from "./child.validation";

const router = Router();

router.get("/", authorize(UserRole.PARENT), childControllers.getAllChildren);

router.get(
  "/requests",
  authorize(UserRole.PARENT),
  childControllers.getChildApprovalRequests
);

router.patch(
  "/:id/status",
  authorize(UserRole.PARENT),
  validate(updateChildStatusSchema),
  childControllers.updateChildStatus
);

router.get(
  "/:id/parents",
  authorize(UserRole.PLAYER),
  childControllers.getParentsByChildId
);

export const childRoutes = router;
