import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { parentController } from "./parent.controller";
import { updateChildAccessZod } from "./parent.validation";

const router = Router();

router.get("/search", parentController.searchParents);
router.put(
  "/children/:childId/access",
  authorize(UserRole.PARENT),
  validate(updateChildAccessZod),
  parentController.updateChildAccess
);

export const parentRoutes = router;
