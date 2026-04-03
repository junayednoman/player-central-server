import z from "zod";
import { ApprovalRequestStatus } from "@prisma/client";

export const updatePostApprovalStatusZod = z.object({
  status: z.nativeEnum(ApprovalRequestStatus),
});

export type TUpdatePostApprovalStatus = z.infer<
  typeof updatePostApprovalStatusZod
>;
