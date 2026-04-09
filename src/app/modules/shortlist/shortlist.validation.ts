import z from "zod";

export const toggleShortlistZod = z.object({
  playerId: z.string().uuid(),
});

export type TToggleShortlist = z.infer<typeof toggleShortlistZod>;
