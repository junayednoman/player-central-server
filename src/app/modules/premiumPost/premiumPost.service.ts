import prisma from "../../utils/prisma";
import { TUpdatePremiumPostConfig } from "./premiumPost.validation";

const getConfig = async () => {
  return prisma.premiumPostConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });
};

const upsertConfig = async (payload: TUpdatePremiumPostConfig) => {
  const existing = await prisma.premiumPostConfig.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (existing) {
    return prisma.premiumPostConfig.update({
      where: { id: existing.id },
      data: {
        price: payload.price,
        currency: payload.currency,
        features: payload.features,
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
    });
  }

  return prisma.premiumPostConfig.create({
    data: {
      price: payload.price,
      currency: payload.currency,
      features: payload.features,
      isActive: payload.isActive ?? true,
    },
  });
};

export const premiumPostServices = {
  getConfig,
  upsertConfig,
};
