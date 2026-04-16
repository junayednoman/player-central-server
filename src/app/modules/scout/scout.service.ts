import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import { TUpdateScoutProfile } from "./scout.validation";

const getMyProfile = async (authId: string) => {
  const scout = await prisma.scoutProfile.findUnique({
    where: { authId },
    include: {
      auth: {
        select: {
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!scout) throw new ApiError(404, "Scout profile not found");

  return scout;
};

const updateProfile = async (
  authId: string,
  payload: TUpdateScoutProfile,
  file?: TFile
) => {
  const scoutProfile = await prisma.scoutProfile.findUnique({
    where: { authId },
    include: {
      auth: {
        select: {
          profile: true,
        },
      },
    },
  });

  if (!scoutProfile) throw new ApiError(404, "Scout profile not found");

  const imageUrl = file ? await uploadToS3(file) : undefined;

  const result = await prisma.$transaction(async tx => {
    if (payload.name || imageUrl) {
      await tx.profile.update({
        where: { authId },
        data: {
          ...(payload.name ? { name: payload.name } : {}),
          ...(imageUrl ? { image: imageUrl } : {}),
        },
      });
    }

    const updatedScout = await tx.scoutProfile.update({
      where: { authId },
      data: {
        ...(payload.organization ? { organization: payload.organization } : {}),
        ...(payload.level ? { level: payload.level } : {}),
        ...(payload.badge ? { badge: payload.badge } : {}),
        ...(payload.intro !== undefined ? { intro: payload.intro } : {}),
      },
      include: {
        auth: {
          select: {
            profile: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return updatedScout;
  });

  if (imageUrl && scoutProfile.auth?.profile?.image) {
    await deleteFromS3(scoutProfile.auth.profile.image);
  }

  return result;
};

export const scoutServices = {
  getMyProfile,
  updateProfile,
};
