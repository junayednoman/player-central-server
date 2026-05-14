import z from "zod";

export const updateChildStatusSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
  }),
});
