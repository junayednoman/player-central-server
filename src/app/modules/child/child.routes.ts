import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import { childControllers } from "./child.controller";
import validate from "../../middlewares/validate";
import { addNewParentZod, updateChildStatusSchema } from "./child.validation";

const router = Router();

router.get("/", authorize(UserRole.PARENT), childControllers.getAllChildren);
router.get(
  "/available",
  authorize(UserRole.PARENT),
  childControllers.getAllAvailableChild
);

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
  authorize(UserRole.PARENT),
  childControllers.getParentsByChildId
);

router.patch(
  "/:id/default",
  authorize(UserRole.PARENT),
  childControllers.updateDefaultChildId
);

router.get(
  "/parents/requests",
  authorize(UserRole.PARENT),
  childControllers.getAllReceivedAddNewParentRequests
);

router.post(
  "/:id/parents",
  authorize(UserRole.PARENT),
  validate(addNewParentZod),
  childControllers.addNewParent
);

router.patch(
  "/:requestId/parents",
  authorize(UserRole.PARENT),
  validate(updateChildStatusSchema),
  childControllers.updateAddNewParentRequest
);

router.post(
  "/:childId/add-request",
  authorize(UserRole.PARENT),
  childControllers.addChildRequest
);

router.get(
  "/add-request",
  authorize(UserRole.PARENT),
  childControllers.getChildAddRequests
);

router.patch(
  "/:addChildRequestId/add-request",
  authorize(UserRole.PARENT),
  validate(updateChildStatusSchema),
  childControllers.updateChildAddRequest
);

router.get(
  "/sign-up-requests",
  authorize(UserRole.PARENT),
  childControllers.getChildSignUpRequests
);

export const childRoutes = router;
