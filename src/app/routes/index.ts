import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { adminRoutes } from "../modules/admin/admin.routes";
import { fileRoutes } from "../modules/uploadFile/uploadFile.routes";
import { otpRoutes } from "../modules/otp/otp.routes";
import { notificationRoutes } from "../modules/notification/notification.routes";
import { legalRoutes } from "../modules/legal/legal.routes";
import { playerRoutes } from "../modules/player/player.routes";
import { coachRoutes } from "../modules/coach/coach.routes";
import { challengeRoutes } from "../modules/challenge/challenge.routes";

const router = Router();

const routes = [
  { path: "/auths", route: authRoutes },
  { path: "/admins", route: adminRoutes },
  { path: "/otps", route: otpRoutes },
  { path: "/notifications", route: notificationRoutes },
  { path: "/legal", route: legalRoutes },
  { path: "/upload-files", route: fileRoutes },
  { path: "/players", route: playerRoutes },
  { path: "/coaches", route: coachRoutes },
  { path: "/challenges", route: challengeRoutes },
];

routes.forEach(route => {
  router.use(route.path, route.route);
});

export default router;
