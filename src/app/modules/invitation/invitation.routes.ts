import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { invitationController } from "./invitation.controller";
import { sendInvitationZod } from "./invitation.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.SCOUT),
  validate(sendInvitationZod),
  invitationController.send
);

router.get(
  "/sent",
  authorize(UserRole.SCOUT),
  invitationController.getSent
);

router.get(
  "/received",
  authorize(UserRole.PLAYER),
  invitationController.getReceived
);

export const invitationRoutes = router;
