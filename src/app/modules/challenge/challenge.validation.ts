import z from "zod";
import { ChallengeDifficulty, PlayerPosition } from "@prisma/client";

export const createChallengeZod = z.object({
  category: z.nativeEnum(PlayerPosition),
  title: z.string().min(1, "Title is required").trim(),
  instruction: z.string().min(1, "Instruction is required").trim(),
  difficulty: z.nativeEnum(ChallengeDifficulty),
});

export const updateChallengeZod = z.object({
  category: z.nativeEnum(PlayerPosition).optional(),
  title: z.string().min(1).trim().optional(),
  instruction: z.string().min(1).trim().optional(),
  difficulty: z.nativeEnum(ChallengeDifficulty).optional(),
});

export const submitChallengeZod = z.object({});

export type TCreateChallenge = z.infer<typeof createChallengeZod>;
export type TUpdateChallenge = z.infer<typeof updateChallengeZod>;
export type TSubmitChallenge = z.infer<typeof submitChallengeZod>;
