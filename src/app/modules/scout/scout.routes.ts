import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { uploadImage } from "../../utils/awss3";
import { scoutController } from "./scout.controller";
import { updateScoutProfileZod } from "./scout.validation";

const router = Router();

router.get("/me", authorize(UserRole.SCOUT), scoutController.getMyProfile);
router.patch(
  "/profile",
  authorize(UserRole.SCOUT),
  uploadImage.single("image"),
  validate(updateScoutProfileZod, { formData: true }),
  scoutController.updateProfile
);

export const scoutRoutes = router;
