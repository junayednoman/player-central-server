import z from "zod";
import { CoachSessionMode, CoachSessionType } from "@prisma/client";

export const createCustomSessionZod = z
  .object({
    availabilityBlockId: z.string().min(1, "Availability block is required"),
    date: z
      .string()
      .trim()
      .optional()
      .refine(value => !value || !Number.isNaN(Date.parse(value)), {
        message: "Invalid date",
      }),
    sessionType: z.nativeEnum(CoachSessionType),
    mode: z.nativeEnum(CoachSessionMode),
    maxPlayers: z.number().int().positive(),
    playerAuthIds: z.array(z.string().min(1)).optional(),
  })
  .refine(
    data =>
      !data.playerAuthIds || data.playerAuthIds.length <= data.maxPlayers,
    {
      message: "playerAuthIds exceeds maxPlayers",
      path: ["playerAuthIds"],
    }
  );

export type TCreateCustomSession = z.infer<typeof createCustomSessionZod>;
