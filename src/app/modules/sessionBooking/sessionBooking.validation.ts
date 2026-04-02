import z from "zod";
export const createSessionBookingZod = z
  .object({
    availabilityBlockId: z.string().min(1, "Availability block is required"),
    date: z
      .string()
      .trim()
      .optional()
      .refine(value => !value || !Number.isNaN(Date.parse(value)), {
        message: "Invalid date",
      }),
  })
  .strict();

export type TCreateSessionBooking = z.infer<typeof createSessionBookingZod>;
