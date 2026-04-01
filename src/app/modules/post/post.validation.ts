import z from "zod";
import { ChallengeDifficulty, PlayerPosition, PostType } from "@prisma/client";

export const createPostZod = z.object({
  caption: z.string().min(1, "Caption is required").trim(),
  position: z.nativeEnum(PlayerPosition),
  difficultyType: z.nativeEnum(ChallengeDifficulty),
  type: z.nativeEnum(PostType),
});

export const updatePostZod = z.object({
  caption: z.string().min(1).trim().optional(),
  position: z.nativeEnum(PlayerPosition).optional(),
  difficultyType: z.nativeEnum(ChallengeDifficulty).optional(),
  type: z.nativeEnum(PostType).optional(),
});

export type TCreatePost = z.infer<typeof createPostZod>;
export type TUpdatePost = z.infer<typeof updatePostZod>;
