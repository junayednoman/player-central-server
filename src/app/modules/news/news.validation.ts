import z from "zod";

export const createNewsZod = z.object({
  caption: z.string().min(1, "Caption is required").trim(),
  hashtags: z
    .array(z.string().min(1).trim())
    .min(1, "At least one hashtag is required"),
  link: z.string().trim().url("Invalid URL"),
});
export const updateNewsZod = z.object({
  caption: z.string().min(1).trim().optional(),
  hashtags: z.array(z.string().min(1).trim()).min(1).optional(),
  link: z.string().trim().url("Invalid URL").optional(),
});

export type TCreateNews = z.infer<typeof createNewsZod>;
export type TUpdateNews = z.infer<typeof updateNewsZod>;
