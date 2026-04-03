import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import validate from "../../middlewares/validate";
import { customSessionController } from "./customSession.controller";
import { createCustomSessionZod } from "./customSession.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.COACH),
  validate(createCustomSessionZod),
  customSessionController.create
);

router.get("/", authorize(), customSessionController.getAll);

export const customSessionRoutes = router;
