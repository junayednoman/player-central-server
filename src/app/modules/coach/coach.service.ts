import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TUpdateCoachProfile } from "./coach.validation";

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

  if (query.minPrice || query.maxPrice) {
    const priceFilter: { gte?: number; lte?: number } = {};
    const minPrice = Number(query.minPrice);
    const maxPrice = Number(query.maxPrice);
    if (!Number.isNaN(minPrice)) priceFilter.gte = minPrice;
    if (!Number.isNaN(maxPrice)) priceFilter.lte = maxPrice;
    andConditions.push({ price: priceFilter });
  }

  if (query.minExperience || query.maxExperience) {
    const expFilter: { gte?: number; lte?: number } = {};
    const minExp = Number(query.minExperience);
    const maxExp = Number(query.maxExperience);
    if (!Number.isNaN(minExp)) expFilter.gte = minExp;
    if (!Number.isNaN(maxExp)) expFilter.lte = maxExp;
    andConditions.push({ experience: expFilter });
  }

  if (query.minRating || query.maxRating) {
    const ratingFilter: { gte?: number; lte?: number } = {};
    const minRating = Number(query.minRating);
    const maxRating = Number(query.maxRating);
    if (!Number.isNaN(minRating)) ratingFilter.gte = minRating;
    if (!Number.isNaN(maxRating)) ratingFilter.lte = maxRating;
    andConditions.push({
      auth: {
        coachReviews: {
          some: {
            rating: ratingFilter,
          },
        },
      },
    });
  }

  const whereConditions =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const coaches = await prisma.coachProfile.findMany({
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

  const total = await prisma.coachProfile.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit: take,
      total,
    },
    coaches,
  };
};

const getSingle = async (id: string) => {
  const coach = await prisma.coachProfile.findUnique({
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

  if (!coach) throw new ApiError(404, "Coach not found");

  return coach;
};

const getMyProfile = async (authId: string) => {
  const coach = await prisma.coachProfile.findUnique({
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

  if (!coach) throw new ApiError(404, "Coach profile not found");

  return coach;
};

const updateProfile = async (
  authId: string,
  payload: TUpdateCoachProfile,
  file?: TFile
) => {
  const coachProfile = await prisma.coachProfile.findUnique({
    where: { authId },
    include: {
      auth: {
        select: {
          profile: true,
        },
      },
    },
  });

  if (!coachProfile) throw new ApiError(404, "Coach profile not found");

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

    const updatedCoach = await tx.coachProfile.update({
      where: { authId },
      data: {
        ...(payload.experience ? { experience: payload.experience } : {}),
        ...(payload.location ? { location: payload.location } : {}),
        ...(payload.teams ? { teams: payload.teams } : {}),
        ...(payload.certificate ? { certificate: payload.certificate } : {}),
        ...(payload.price !== undefined ? { price: payload.price } : {}),
        ...(payload.sessionTypes ? { sessionTypes: payload.sessionTypes } : {}),
        ...(payload.mode ? { mode: payload.mode } : {}),
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

    return updatedCoach;
  });

  if (imageUrl && coachProfile.auth?.profile?.image) {
    await deleteFromS3(coachProfile.auth.profile.image);
  }

  return result;
};

export const coachServices = {
  getAll,
  getSingle,
  getMyProfile,
  updateProfile,
};
