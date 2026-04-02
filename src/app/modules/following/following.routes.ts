import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { followingController } from "./following.controller";
import { toggleFollowingZod } from "./following.validation";

const router = Router();

router.post(
  "/",
  authorize(),
  validate(toggleFollowingZod),
  followingController.toggle
);

router.get("/:userId/following", followingController.getFollowing);
router.get("/:userId/followers", followingController.getFollowers);

export const followingRoutes = router;
