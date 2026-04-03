import z from "zod";
import { ApprovalRequestStatus } from "@prisma/client";

export const createChallengeApprovalRequestZod = z.object({
  challengeId: z.string().min(1, "challengeId is required"),
  video: z.string().min(1, "video is required"),
});

export const updateChallengeApprovalStatusZod = z.object({
  status: z.nativeEnum(ApprovalRequestStatus),
});

export type TCreateChallengeApprovalRequest = z.infer<
  typeof createChallengeApprovalRequestZod
>;
export type TUpdateChallengeApprovalStatus = z.infer<
  typeof updateChallengeApprovalStatusZod
>;
