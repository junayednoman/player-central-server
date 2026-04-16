import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { parentController } from "./parent.controller";
import {
  updateChildAccessZod,
  updateParentProfileZod,
} from "./parent.validation";
import { uploadImage } from "../../utils/awss3";

const router = Router();

router.get("/me", authorize(UserRole.PARENT), parentController.getMyProfile);
router.get("/search", parentController.searchParents);
router.patch(
  "/profile",
  authorize(UserRole.PARENT),
  uploadImage.single("image"),
  validate(updateParentProfileZod, { formData: true }),
  parentController.updateProfile
);
router.put(
  "/children/:childId/access",
  authorize(UserRole.PARENT),
  validate(updateChildAccessZod),
  parentController.updateChildAccess
);

export const parentRoutes = router;
