import prisma from "../../utils/prisma";
import { TUpdatePlayerProfile } from "./player.validation";
import ApiError from "../../classes/ApiError";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";

const getAll = async (
  options: TPaginationOptions,
  query: Record<string, any>
) => {
  const andConditions: any[] = [];

  if (query.searchTerm) {
    andConditions.push({
      auth: {
        profile: {
          name: { contains: query.searchTerm, mode: "insensitive" },
        },
      },
    });
  }

  if (query.position) {
    andConditions.push({
      position: query.position,
    });
  }

  if (query.ageGroup) {
    const ageRanges: Record<string, { min: number; max: number }> = {
      "5-8": { min: 5, max: 8 },
      "8-12": { min: 8, max: 12 },
      "12-18": { min: 12, max: 18 },
      "18-25": { min: 18, max: 25 },
    };

    const range = ageRanges[String(query.ageGroup)];
    if (range) {
      const today = new Date();
      const maxDob = new Date(today);
      maxDob.setFullYear(today.getFullYear() - range.min);
      const minDob = new Date(today);
      minDob.setFullYear(today.getFullYear() - range.max);

      andConditions.push({
        dob: {
          gte: minDob,
          lte: maxDob,
        },
      });
    }
  }

  const whereConditions =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const players = await prisma.playerProfile.findMany({
    where: whereConditions,
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
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.playerProfile.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit: take,
      total,
    },
    players,
  };
};

const getSingle = async (id: string) => {
  const player = await prisma.playerProfile.findUnique({
    where: { id },
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

  if (!player) throw new ApiError(404, "Player not found");

  return player;
};

const getMyProfile = async (authId: string) => {
  const player = await prisma.playerProfile.findUnique({
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

  if (!player) throw new ApiError(404, "Player profile not found");

  return player;
};

const updateProfile = async (
  authId: string,
  payload: TUpdatePlayerProfile,
  file?: TFile
) => {
  const playerProfile = await prisma.playerProfile.findUnique({
    where: { authId },
    include: {
      auth: {
        select: {
          profile: true,
        },
      },
    },
  });

  if (!playerProfile) throw new ApiError(404, "Player profile not found");

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

    const updatedPlayer = await tx.playerProfile.update({
      where: { authId },
      data: {
        ...(payload.dob ? { dob: payload.dob } : {}),
        ...(payload.height ? { height: payload.height } : {}),
        ...(payload.position ? { position: payload.position } : {}),
        ...(payload.bio ? { bio: payload.bio } : {}),
      },
      include: {
        auth: {
          select: {
            profile: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });

    return updatedPlayer;
  });

  if (imageUrl && playerProfile.auth?.profile?.image) {
    await deleteFromS3(playerProfile.auth.profile.image);
  }

  return result;
};

export const playerServices = {
  getAll,
  getSingle,
  getMyProfile,
  updateProfile,
};
