import { Router } from "express";
import { playerController } from "./player.controller";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import { uploadImage } from "../../utils/awss3";
import validate from "../../middlewares/validate";
import { updatePlayerProfileZod } from "./player.validation";

const router = Router();

router.get("/", playerController.getAll);
router.get("/me", authorize(UserRole.PLAYER), playerController.getMyProfile);
router.get("/:id", playerController.getSingle);
router.patch(
  "/profile",
  authorize(UserRole.PLAYER),
  uploadImage.single("image"),
  validate(updatePlayerProfileZod, { formData: true }),
  playerController.updateProfile
);

export const playerRoutes = router;
