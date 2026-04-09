import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { supportController } from "./support.controller";
import { createSupportMessageZod } from "./support.validation";

const router = Router();

router.post(
  "/",
  authorize(),
  validate(createSupportMessageZod),
  supportController.create
);

export const supportRoutes = router;
