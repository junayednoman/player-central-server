import { Router } from "express";
import { challengeController } from "./challenge.controller";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import validate from "../../middlewares/validate";
import {
  createChallengeZod,
  submitChallengeZod,
  updateChallengeZod,
} from "./challenge.validation";
import { upload } from "../../utils/awss3";

const router = Router();

router.post(
  "/",
  authorize(UserRole.COACH),
  upload.single("video"),
  validate(createChallengeZod, { formData: true }),
  challengeController.create
);
router.get("/", challengeController.getAll);
router.get(
  "/submissions/my",
  authorize(UserRole.COACH),
  challengeController.getCoachSubmissions
);
router.get("/:challengeId", challengeController.getSingle);
router.put(
  "/:challengeId",
  authorize(UserRole.COACH),
  validate(updateChallengeZod),
  challengeController.update
);
router.delete(
  "/:challengeId",
  authorize(UserRole.COACH),
  challengeController.remove
);
router.post(
  "/:challengeId/submit",
  authorize(UserRole.PLAYER),
  upload.single("video"),
  validate(submitChallengeZod, { formData: true }),
  challengeController.submit
);

export const challengeRoutes = router;
