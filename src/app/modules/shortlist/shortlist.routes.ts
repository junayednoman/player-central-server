import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { shortlistController } from "./shortlist.controller";
import { toggleShortlistZod } from "./shortlist.validation";

const router = Router();

router.post(
  "/toggle",
  authorize(UserRole.SCOUT),
  validate(toggleShortlistZod),
  shortlistController.toggle
);

router.get(
  "/my-players",
  authorize(UserRole.SCOUT),
  shortlistController.getMyShortlistedPlayers
);

export const shortlistRoutes = router;
