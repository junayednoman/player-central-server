import z from "zod";

export const sendInvitationZod = z.object({
  playerId: z.string().uuid(),
  trialDate: z.coerce.date(),
  street: z.string().min(1).trim(),
  buildingNumber: z.string().min(1).trim(),
  postCode: z.string().min(1).trim(),
  instruction: z.string().min(1).trim(),
});

export type TSendInvitation = z.infer<typeof sendInvitationZod>;
