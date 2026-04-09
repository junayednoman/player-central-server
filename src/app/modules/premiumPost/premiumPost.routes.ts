import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { premiumPostController } from "./premiumPost.controller";
import { updatePremiumPostConfigZod } from "./premiumPost.validation";

const router = Router();

router.get("/", premiumPostController.getConfig);

router.put(
  "/",
  authorize(UserRole.ADMIN),
  validate(updatePremiumPostConfigZod),
  premiumPostController.upsertConfig
);

export const premiumPostRoutes = router;
