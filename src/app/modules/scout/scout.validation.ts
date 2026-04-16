import z from "zod";
import { ScoutLevel } from "@prisma/client";

export const updateScoutProfileZod = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
  organization: z
    .string()
    .min(1, "Organization is required")
    .trim()
    .optional(),
  level: z.nativeEnum(ScoutLevel).optional(),
  badge: z.string().min(1, "Badge is required").trim().optional(),
  intro: z.string().trim().optional(),
});

export type TUpdateScoutProfile = z.infer<typeof updateScoutProfileZod>;
