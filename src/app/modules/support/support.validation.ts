import z from "zod";

export const createSupportMessageZod = z.object({
  subject: z.string().min(1).trim(),
  description: z.string().min(1).trim(),
});

export type TCreateSupportMessage = z.infer<typeof createSupportMessageZod>;
