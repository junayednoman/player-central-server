import z from "zod";

export const createReportZod = z
  .object({
    reason: z.string().min(1, "Reason is required").trim(),
    postId: z.string().uuid().optional(),
    challengeId: z.string().uuid().optional(),
  })
  .refine(data => (data.postId ? 1 : 0) + (data.challengeId ? 1 : 0) === 1, {
    message: "Provide either postId or challengeId",
  });

export const getReportsQueryZod = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  type: z
    .enum(["COMMUNITY_POST", "PREMIUM_POST", "CHALLENGE"])
    .optional(),
});

export const removeReportedContentZod = z.object({
  type: z.enum(["COMMUNITY_POST", "PREMIUM_POST", "CHALLENGE"]),
});

export type TCreateReport = z.infer<typeof createReportZod>;
