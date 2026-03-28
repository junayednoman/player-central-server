import z from "zod";
import { CoachSessionMode, CoachSessionType } from "@prisma/client";

export const updateCoachProfileZod = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
  experience: z.number().nonnegative().optional(),
  location: z.string().min(1, "Location is required").trim().optional(),
  teams: z.array(z.string().min(1)).optional(),
  certificate: z.string().min(1, "Certificate is required").trim().optional(),
  price: z.number().nonnegative().optional(),
  sessionTypes: z.array(z.nativeEnum(CoachSessionType)).optional(),
  mode: z.nativeEnum(CoachSessionMode).optional(),
});

export type TUpdateCoachProfile = z.infer<typeof updateCoachProfileZod>;
