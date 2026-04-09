import z from "zod";

export const createConversationZod = z.object({
  participantId: z.string().uuid(),
});

export const sendMessageZod = z.object({
  text: z.string().min(1).trim(),
});

export const markConversationReadZod = z.object({});

export type TCreateConversation = z.infer<typeof createConversationZod>;
export type TSendMessage = z.infer<typeof sendMessageZod>;
