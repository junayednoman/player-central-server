import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TUpdateParentProfile } from "./parent.validation";

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

const getMyProfile = async (authId: string) => {
  const [parent, childCount] = await Promise.all([
    prisma.parentProfile.findUnique({
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
    }),
    prisma.child.count({
      where: {
        parentAuthIds: {
          has: authId,
        },
      },
    }),
  ]);

  if (!parent) throw new ApiError(404, "Parent profile not found");

  return {
    ...parent,
    hasChild: childCount > 0,
  };
};

const updateProfile = async (
  authId: string,
  payload: TUpdateParentProfile,
  file?: TFile
) => {
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { authId },
    include: {
      auth: {
        select: {
          profile: true,
        },
      },
    },
  });

  if (!parentProfile) throw new ApiError(404, "Parent profile not found");

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

    const updatedParent = await tx.parentProfile.update({
      where: { authId },
      data: {
        ...(payload.phone ? { phone: payload.phone } : {}),
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

    const childCount = await tx.child.count({
      where: {
        parentAuthIds: {
          has: authId,
        },
      },
    });

    return {
      ...updatedParent,
      hasChild: childCount > 0,
    };
  });

  if (imageUrl && parentProfile.auth?.profile?.image) {
    await deleteFromS3(parentProfile.auth.profile.image);
  }

  return result;
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
  getMyProfile,
  updateProfile,
  updateChildAccess,
};
