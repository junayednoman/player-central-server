import { z } from "zod";

export const createReviewValidation = z.object({
  giverAuthId: z.string().min(1, "Giver auth ID is required"),
  coachAuthId: z.string().min(1, "Coach auth ID is required"),
  text: z.string().min(1, "Text is required"),
  rating: z
    .number()
    .min(1, "Rating is required")
    .max(5, "Rating must be between 1 and 5"),
});

export type TCreateReview = z.infer<typeof createReviewValidation>;
