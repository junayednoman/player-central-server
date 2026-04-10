import z from "zod";

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
