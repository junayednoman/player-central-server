import z from "zod";

export const profileUpdateZod = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
});

export const dashboardStatsQueryZod = z.object({
  year: z.coerce.number().int().min(2000).max(3000),
});

export const earningStatsQueryZod = z
  .object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    searchTerm: z.string().trim().optional(),
    type: z
      .enum([
        "COACH_SUBSCRIPTION",
        "SCOUT_SUBSCRIPTION",
        "PREMIUM_CONTENT",
      ])
      .optional(),
    year: z.coerce.number().int().min(2000).max(3000).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  })
  .refine(data => !data.month || !!data.year, {
    message: "Year is required when month is provided",
    path: ["month"],
  })
  .refine(
    data =>
      !data.dateFrom ||
      !data.dateTo ||
      data.dateFrom.getTime() <= data.dateTo.getTime(),
    {
      message: "dateFrom must be earlier than or equal to dateTo",
      path: ["dateTo"],
    }
  );
