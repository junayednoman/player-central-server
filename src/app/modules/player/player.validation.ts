import z from "zod";
import { PlayerPosition } from "@prisma/client";

export const updatePlayerProfileZod = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
  dob: z.coerce.date().optional(),
  height: z.string().min(1, "Height is required").trim().optional(),
  position: z.nativeEnum(PlayerPosition).optional(),
  bio: z.string().min(1, "Bio is required").trim().optional(),
});

export type TUpdatePlayerProfile = z.infer<typeof updatePlayerProfileZod>;
