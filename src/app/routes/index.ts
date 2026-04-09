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
import { postRoutes } from "../modules/post/post.routes";
import { sessionBookingRoutes } from "../modules/sessionBooking/sessionBooking.routes";
import { followingRoutes } from "../modules/following/following.routes";
import { customSessionRoutes } from "../modules/customSession/customSession.routes";
import { postApprovalRequestRoutes } from "../modules/postApprovalRequest/postApprovalRequest.routes";
import { challengeApprovalRequestRoutes } from "../modules/challengeApprovalRequest/challengeApprovalRequest.routes";
import { parentRoutes } from "../modules/parent/parent.routes";
import { bookingApprovalRequestRoutes } from "../modules/bookingApprovalRequest/bookingApprovalRequest.routes";
import {
  subscriptionPlanRoutes,
  subscriptionRoutes,
} from "../modules/subscription/subscription.routes";
import { premiumPostRoutes } from "../modules/premiumPost/premiumPost.routes";
import { shortlistRoutes } from "../modules/shortlist/shortlist.routes";
import { invitationRoutes } from "../modules/invitation/invitation.routes";

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
  { path: "/posts", route: postRoutes },
  { path: "/session-bookings", route: sessionBookingRoutes },
  { path: "/following", route: followingRoutes },
  { path: "/users", route: followingRoutes },
  { path: "/custom-sessions", route: customSessionRoutes },
  { path: "/post-approval-requests", route: postApprovalRequestRoutes },
  { path: "/challenge-approval-requests", route: challengeApprovalRequestRoutes },
  { path: "/parents", route: parentRoutes },
  { path: "/booking-approval-requests", route: bookingApprovalRequestRoutes },
  { path: "/subscription-plans", route: subscriptionPlanRoutes },
  { path: "/subscriptions", route: subscriptionRoutes },
  { path: "/premium-post-config", route: premiumPostRoutes },
  { path: "/shortlists", route: shortlistRoutes },
  { path: "/invitations", route: invitationRoutes },
];

routes.forEach(route => {
  router.use(route.path, route.route);
});

export default router;
