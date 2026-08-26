import z from "zod";
import { UserRole } from "@prisma/client";

export const paymentTransactionsQueryZod = z
  .object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    sortBy: z.string().trim().optional(),
    orderBy: z.enum(["asc", "desc"]).optional(),
    year: z.coerce.number().int().min(2000).max(3000).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  })
  .refine(data => !data.month || !!data.year, {
    message: "Year is required when month is provided",
    path: ["month"],
  });

export const paymentRoleTotalQueryZod = z
  .object({
    role: z.enum([UserRole.PLAYER, UserRole.COACH, UserRole.SCOUT]),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
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
