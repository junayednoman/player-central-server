import z from "zod";
import {
  CoachAvailabilityDaysOfWeek,
  CoachAvailabilityType,
  CoachSessionMode,
  CoachSessionType,
} from "@prisma/client";

export const updateCoachProfileZod = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
  experience: z.number().nonnegative().optional(),
  location: z.string().min(1, "Location is required").trim().optional(),
  teams: z.array(z.string().min(1)).optional(),
  certificate: z.string().min(1, "Certificate is required").trim().optional(),
  price: z.number().nonnegative().optional(),
  sessionTypes: z.array(z.nativeEnum(CoachSessionType)).optional(),
  mode: z.nativeEnum(CoachSessionMode).optional(),
});

export const createCoachAvailabilityZod = z
  .object({
    type: z.nativeEnum(CoachAvailabilityType),
    isRecurring: z.boolean(),
    dayOfWeek: z.nativeEnum(CoachAvailabilityDaysOfWeek).optional(),
    startTime: z.string().trim().optional(),
    endTime: z.string().trim().optional(),
    startAt: z.string().trim().optional(),
    endAt: z.string().trim().optional(),
    validFrom: z.string().trim().optional(),
    validUntil: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring) {
      if (!data.dayOfWeek) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "dayOfWeek is required for recurring blocks",
          path: ["dayOfWeek"],
        });
      }
      if (!data.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "startTime is required for recurring blocks",
          path: ["startTime"],
        });
      }
      if (!data.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endTime is required for recurring blocks",
          path: ["endTime"],
        });
      }
    } else {
      if (!data.startAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "startAt is required for one-time blocks",
          path: ["startAt"],
        });
      }
      if (!data.endAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endAt is required for one-time blocks",
          path: ["endAt"],
        });
      }
    }
  });

export type TUpdateCoachProfile = z.infer<typeof updateCoachProfileZod>;
export type TCreateCoachAvailability = z.infer<
  typeof createCoachAvailabilityZod
>;
