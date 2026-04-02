import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import validate from "../../middlewares/validate";
import { sessionBookingController } from "./sessionBooking.controller";
import { createSessionBookingZod } from "./sessionBooking.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.PLAYER),
  validate(createSessionBookingZod),
  sessionBookingController.create
);

router.get("/", authorize(), sessionBookingController.getAll);
router.get("/recent", authorize(), sessionBookingController.getRecent);

export const sessionBookingRoutes = router;
