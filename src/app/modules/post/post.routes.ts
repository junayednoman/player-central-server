import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import validate from "../../middlewares/validate";
import { upload } from "../../utils/awss3";
import { postController } from "./post.controller";
import { createPostZod, updatePostZod } from "./post.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.PLAYER),
  upload.single("video"),
  validate(createPostZod, { formData: true }),
  postController.create
);

router.get("/", postController.getAll);

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

router.post("/:postId/share", postController.share);

export const postRoutes = router;
