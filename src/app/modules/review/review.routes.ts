import { Router } from "express";
import { reviewController } from "./review.controller";
import validate from "../../middlewares/validate";
import { createReviewValidation } from "./review.validation";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/",
  validate(createReviewValidation),
  authorize(UserRole.PLAYER),
  reviewController.createReview
);
router.get(
  "/",
  authorize(UserRole.PLAYER, UserRole.COACH),
  reviewController.getAllReviews
);
router.delete(
  "/:id",
  authorize(UserRole.PLAYER),
  reviewController.deleteReview
);

export const reviewRoutes = router;
