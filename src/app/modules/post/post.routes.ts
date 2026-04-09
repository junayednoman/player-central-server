import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import validate from "../../middlewares/validate";
import { upload } from "../../utils/awss3";
import { postController } from "./post.controller";
import {
  createCommentZod,
  createPostZod,
  toggleReactionZod,
  updateCommentZod,
  updatePostZod,
} from "./post.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.PLAYER),
  upload.single("video"),
  validate(createPostZod, { formData: true }),
  postController.create
);

router.get("/", authorize({ optional: true }), postController.getAll);

router.post(
  "/:postId/confirm-payment",
  authorize(UserRole.PLAYER),
  postController.confirmPayment
);

router.put(
  "/:postId",
  authorize(UserRole.PLAYER),
  upload.single("video"),
  validate(updatePostZod, { formData: true }),
  postController.update
);

router.delete(
  "/:postId",
  authorize(UserRole.PLAYER),
  postController.remove
);

router.post("/:postId/share", authorize(), postController.share);

router.post(
  "/:postId/comments",
  authorize(),
  validate(createCommentZod),
  postController.addComment
);
router.put(
  "/comments/:commentId",
  authorize(),
  validate(updateCommentZod),
  postController.updateComment
);
router.delete(
  "/comments/:commentId",
  authorize(),
  postController.removeComment
);

router.post(
  "/:postId/reactions/toggle",
  authorize(),
  validate(toggleReactionZod),
  postController.toggleReaction
);

export const postRoutes = router;
