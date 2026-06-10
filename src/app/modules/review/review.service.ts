import { Prisma } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import prisma from "../../utils/prisma";
import { TCreateReview } from "./review.validation";

const createReview = async (payload: TCreateReview, authId: string) => {
  await prisma.auth.findUniqueOrThrow({
    where: {
      id: payload.coachAuthId,
    },
  });

  if (authId) {
    payload.giverAuthId = authId;
  } else {
    throw new ApiError(401, "Unauthorized");
  }

  const review = await prisma.review.create({
    data: payload,
  });

  return review;
};

const getAllReviews = async (
  options: TPaginationOptions,
  query: Record<string, any>
) => {
  const andConditions: Prisma.ReviewWhereInput[] = [];

  if (query.coachAuthId) {
    andConditions.push({
      coachAuthId: query.coachAuthId,
    });
  }

  if (query.giverAuthId) {
    andConditions.push({
      giverAuthId: query.giverAuthId,
    });
  }

  if (query.rating) {
    andConditions.push({
      rating: Number(query.rating),
    });
  }

  const whereConditions =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const reviews = await prisma.review.findMany({
    where: whereConditions,
    include: {
      giver: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
      coach: {
        select: {
          id: true,
          email: true,
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
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { givenAt: "desc" },
  });

  const total = await prisma.review.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit: take,
      total,
    },
    data: reviews,
  };
};

const deleteReview = async (id: string, authId: string) => {
  const review = await prisma.review.findUniqueOrThrow({
    where: {
      id,
    },
  });

  if (review.giverAuthId !== authId) {
    throw new ApiError(403, "Forbidden");
  }

  await prisma.review.delete({
    where: {
      id,
    },
  });
};

export const reviewService = {
  createReview,
  getAllReviews,
  deleteReview,
};
