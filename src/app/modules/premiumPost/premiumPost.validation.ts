import z from "zod";

export const updatePremiumPostConfigZod = z.object({
  price: z.number().positive(),
  currency: z.string().min(3).trim().toLowerCase(),
  features: z.array(z.string().min(1).trim()).min(1),
  isActive: z.boolean().optional(),
});

export type TUpdatePremiumPostConfig = z.infer<
  typeof updatePremiumPostConfigZod
>;
