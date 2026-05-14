import { ChildStatus, Prisma } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import prisma from "../../utils/prisma";

const getAllChildren = async (query: Record<string, any>) => {
  const { searchTerm, page = 1, limit = 10 } = query;

  const skip = (Number(page) - 1) * Number(limit);

  const andConditions: Prisma.ChildWhereInput[] = [];

  andConditions.push({
    status: "APPROVED",
  });

  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          player: {
            profile: {
              name: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          player: {
            email: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  const whereConditions: Prisma.ChildWhereInput = andConditions.length
    ? { AND: andConditions }
    : {};

  const [data, total] = await Promise.all([
    prisma.child.findMany({
      where: whereConditions,
      include: {
        player: {
          select: {
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
      take: Number(limit),
    }),

    prisma.child.count({
      where: whereConditions,
    }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data,
  };
};

const getChildApprovalRequests = async (parentAuthId: string) => {
  const result = await prisma.child.findMany({
    where: {
      parentAuthIds: {
        has: parentAuthId,
      },
      status: "PENDING",
    },
    include: {
      player: {
        select: {
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
  });

  return result;
};

const updateChildStatus = async (
  childId: string,
  parentAuthId: string,
  status: "APPROVED" | "REJECTED"
) => {
  const child = await prisma.child.findFirst({
    where: {
      id: childId,
      parentAuthIds: {
        has: parentAuthId,
      },
    },
  });

  if (!child) {
    throw new ApiError(494, "Child not found");
  }

  if (status === ChildStatus.APPROVED) {
    const result = await prisma.child.update({
      where: {
        id: childId,
      },
      data: {
        status,
      },
    });
    return result;
  }

  const result = await prisma.child.delete({
    where: { id: childId },
  });

  return result;
};

const getParentsByChildId = async (id: string) => {
  const child = await prisma.child.findUniqueOrThrow({
    where: { id },
    select: {
      parents: {
        select: {
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
  });

  return child.parents;
};

export const childService = {
  getAllChildren,
  getChildApprovalRequests,
  updateChildStatus,
  getParentsByChildId,
};
