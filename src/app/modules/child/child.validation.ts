import z from "zod";

export const updateChildStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const addNewParentZod = z.object({
  parentId: z.string().uuid(),
});

export type TUpdateNewParent = z.infer<typeof addNewParentZod>;
