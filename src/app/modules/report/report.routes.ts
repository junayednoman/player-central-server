import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { reportController } from "./report.controller";
import { createReportZod } from "./report.validation";

const router = Router();

router.post("/", authorize(), validate(createReportZod), reportController.create);
router.get("/", authorize(UserRole.ADMIN), reportController.getAll);
router.delete(
  "/content/:contentId",
  authorize(UserRole.ADMIN),
  reportController.removeContent
);

export const reportRoutes = router;
