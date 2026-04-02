import z from "zod";

export const toggleFollowingZod = z.object({
  userId: z.string().min(1, "userId is required"),
});

export type TToggleFollowing = z.infer<typeof toggleFollowingZod>;
