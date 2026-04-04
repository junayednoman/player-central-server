import z from "zod";
import { ApprovalRequestStatus } from "@prisma/client";

export const updateBookingApprovalStatusZod = z.object({
  status: z.nativeEnum(ApprovalRequestStatus),
});

export type TUpdateBookingApprovalStatus = z.infer<
  typeof updateBookingApprovalStatusZod
>;
