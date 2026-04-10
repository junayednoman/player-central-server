import z from "zod";

export const profileUpdateZod = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
});

export const dashboardStatsQueryZod = z.object({
  year: z.coerce.number().int().min(2000).max(3000),
});
