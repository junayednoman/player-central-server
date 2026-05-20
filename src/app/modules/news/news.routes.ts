import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { newsController } from "./news.controller";
import { createNewsZod, updateNewsZod } from "./news.validation";
import { uploadImage } from "../../utils/awss3";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/",
  authorize(UserRole.ADMIN),
  uploadImage.single("image"),
  validate(createNewsZod, { formData: true }),
  newsController.create
);

router.get("/", authorize(), newsController.getAll);
router.get("/:id", authorize(), newsController.getSingle);

router.patch(
  "/:id",
  authorize(UserRole.ADMIN),
  uploadImage.single("image"),
  validate(updateNewsZod),
  newsController.update
);

router.delete("/:id", authorize(UserRole.ADMIN), newsController.remove);

export const newsRoutes = router;
