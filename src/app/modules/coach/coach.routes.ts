import { Router } from "express";
import { coachController } from "./coach.controller";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import { uploadImage } from "../../utils/awss3";
import validate from "../../middlewares/validate";
import {
  createCoachAvailabilityZod,
  updateCoachProfileZod,
} from "./coach.validation";

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
router.post(
  "/availability",
  authorize(UserRole.COACH),
  validate(createCoachAvailabilityZod),
  coachController.addAvailability
);
router.delete(
  "/availability/:availabilityId",
  authorize(UserRole.COACH),
  coachController.removeAvailability
);
router.get(
  "/:coachId/availability/calendar",
  coachController.getAvailabilityCalendar
);
router.get(
  "/:coachId/availability/slots",
  coachController.getAvailabilitySlots
);

export const coachRoutes = router;
