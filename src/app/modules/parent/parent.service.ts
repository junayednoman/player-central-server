import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";

const searchParents = async (email: string, options: TPaginationOptions) => {
  if (!email) throw new ApiError(400, "Email query is required");

  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const parents = await prisma.auth.findMany({
    where: {
      role: "PARENT",
      email: { contains: email, mode: "insensitive" },
    },
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          image: true,
        },
      },
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { email: "asc" },
  });

  const total = await prisma.auth.count({
    where: {
      role: "PARENT",
      email: { contains: email, mode: "insensitive" },
    },
  });

  return {
    meta: { page, limit: take, total },
    parents,
  };
};

type TUpdateChildAccessPayload = {
  whoCanComment?: "EVERYONE" | "COACH" | "SCOUT";
  whoCanFollow?: "EVERYONE" | "COACH" | "SCOUT";
};

const updateChildAccess = async (
  parentAuthId: string,
  childId: string,
  payload: TUpdateChildAccessPayload
) => {
  const child = await prisma.child.findFirst({
    where: {
      id: childId,
      parentAuthIds: {
        has: parentAuthId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!child) {
    throw new ApiError(404, "Child not found for this parent");
  }

  return prisma.child.update({
    where: {
      id: childId,
    },
    data: {
      ...(payload.whoCanComment && { whoCanComment: payload.whoCanComment }),
      ...(payload.whoCanFollow && { whoCanFollow: payload.whoCanFollow }),
    },
  });
};

export const parentServices = {
  searchParents,
  updateChildAccess,
};
