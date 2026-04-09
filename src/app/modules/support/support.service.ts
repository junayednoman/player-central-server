import prisma from "../../utils/prisma";
import { TCreateSupportMessage } from "./support.validation";

const create = async (
  senderAuthId: string,
  payload: TCreateSupportMessage
) => {
  return prisma.supportMessage.create({
    data: {
      senderAuthId,
      subject: payload.subject,
      description: payload.description,
    },
  });
};

export const supportServices = {
  create,
};
