import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { PlayerBookmarkController } from "./bookmark.controller";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/:playerAuthId/toggle",
  authorize(UserRole.COACH),
  PlayerBookmarkController.toggleBookmark
);

router.get(
  "/",
  authorize(UserRole.COACH),
  PlayerBookmarkController.getBookmarks
);

export const playerBookmarkRoutes = router;
