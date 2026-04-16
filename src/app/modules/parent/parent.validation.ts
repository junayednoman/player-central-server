import z from "zod";

export const updateParentProfileZod = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
  phone: z.string().min(1, "Phone is required").trim().optional(),
});

export const updateChildAccessZod = z
  .object({
    whoCanComment: z.enum(["EVERYONE", "COACH", "SCOUT"]).optional(),
    whoCanFollow: z.enum(["EVERYONE", "COACH", "SCOUT"]).optional(),
  })
  .refine(
    data =>
      typeof data.whoCanComment !== "undefined" ||
      typeof data.whoCanFollow !== "undefined",
    {
      message: "At least one access setting is required",
    }
  );

export type TUpdateParentProfile = z.infer<typeof updateParentProfileZod>;
