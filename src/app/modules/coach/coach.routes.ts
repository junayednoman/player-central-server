import { Router } from "express";
import { coachController } from "./coach.controller";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import { uploadImage } from "../../utils/awss3";
import validate from "../../middlewares/validate";
import { updateCoachProfileZod } from "./coach.validation";

const router = Router();

router.get("/", coachController.getAll);
router.get("/me", authorize(UserRole.COACH), coachController.getMyProfile);
router.get("/:id", coachController.getSingle);
router.patch(
  "/profile",
  authorize(UserRole.COACH),
  uploadImage.single("image"),
  validate(updateCoachProfileZod, { formData: true }),
  coachController.updateProfile
);

export const coachRoutes = router;
