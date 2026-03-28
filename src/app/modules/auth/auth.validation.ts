import z from "zod";
import { emailZod, passwordZod } from "../../validation/global.validation";
import {
  CoachSessionType,
  ChildRelationShip,
  PlayerPosition,
  ScoutLevel,
  UserStatus,
} from "@prisma/client";
import { CoachSessionMode } from "@prisma/client";

const commonSignupFields = {
  email: emailZod,
  password: passwordZod,
  name: z.string().min(1, "Name is required").trim(),
};

const availabilityBlockZod = z.object({
  type: z.enum(["AVAILABLE", "BLACKOUT"]),
  isRecurring: z.boolean(),
  dayOfWeek: z.enum(["D0", "D1", "D2", "D3", "D4", "D5", "D6"]).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

const playerSignupZod = z.object({
  role: z.literal("PLAYER"),
  ...commonSignupFields,
  dob: z.coerce.date(),
  height: z.string().min(1, "Height is required").trim(),
  position: z.nativeEnum(PlayerPosition),
  bio: z.string().min(1, "Bio is required").trim(),
  parentId: z.string().optional(),
  parentRelationship: z.nativeEnum(ChildRelationShip).optional(),
});

const coachSignupZod = z.object({
  role: z.literal("COACH"),
  ...commonSignupFields,
  experience: z.string().min(1, "Experience is required").trim(),
  location: z.string().min(1, "Location is required").trim(),
  teams: z.array(z.string().min(1)).nonempty("Teams are required"),
  certificate: z.string().min(1, "Certificate is required").trim(),
  price: z.number().nonnegative(),
  sessionTypes: z
    .array(z.nativeEnum(CoachSessionType))
    .nonempty("Session types are required"),
  mode: z.nativeEnum(CoachSessionMode),
  availabilityBlocks: z
    .array(availabilityBlockZod)
    .nonempty("At least one availability block is required"),
});

const scoutSignupZod = z.object({
  role: z.literal("SCOUT"),
  ...commonSignupFields,
  organization: z.string().min(1, "Organization is required").trim(),
  level: z.nativeEnum(ScoutLevel),
  badge: z.string().min(1, "Badge is required").trim(),
});

const parentSignupZod = z.object({
  role: z.literal("PARENT"),
  ...commonSignupFields,
  phone: z.string().min(1, "Phone is required").trim(),
});

export const signupZod = z.discriminatedUnion("role", [
  playerSignupZod,
  coachSignupZod,
  scoutSignupZod,
  parentSignupZod,
]);

export type TSignup = z.infer<typeof signupZod>;

export const loginZodSchema = z.object({
  email: emailZod,
  password: passwordZod,
  fcmToken: z.string().optional(),
  isMobileApp: z.boolean().default(false),
});

export type TLoginInput = z.infer<typeof loginZodSchema>;

export const googleLoginSchema = z.object({
  email: emailZod,
  name: z.string(),
  image: z.string(),
  fcmToken: z.string(),
  role: z.enum(["PLAYER", "COACH", "SCOUT", "PARENT"]),
});

export type TGoogleLoginInput = z.infer<typeof googleLoginSchema>;

export const resetPasswordZod = z.object({
  email: emailZod,
  password: passwordZod,
  resetToken: z.string().min(1, "Reset token is required"),
});

export type TResetPasswordInput = z.infer<typeof resetPasswordZod>;

export const changePasswordZod = z.object({
  oldPassword: passwordZod,
  newPassword: passwordZod,
});

export type TChangePasswordInput = z.infer<typeof changePasswordZod>;

export const changeAccountStatusZod = z.object({
  status: z
    .enum([UserStatus.ACTIVE, UserStatus.DELETED, UserStatus.BLOCKED])
    .default("ACTIVE")
    .transform(val => val.toUpperCase()),
});
