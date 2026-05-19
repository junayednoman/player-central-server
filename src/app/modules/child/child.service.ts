import { ChildStatus, Prisma } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import prisma from "../../utils/prisma";
import { TUpdateNewParent } from "./child.validation";

const getAllChildren = async (
  query: Record<string, any>,
  parentAuthId: string
) => {
  const { searchTerm, page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const andConditions: Prisma.ChildWhereInput[] = [];

  andConditions.push({
    status: "APPROVED",
    parents: {
      some: { id: parentAuthId },
    },
  });

  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          player: {
            profile: {
              name: { contains: searchTerm, mode: "insensitive" },
            },
          },
        },
        {
          player: {
            email: { contains: searchTerm, mode: "insensitive" },
          },
        },
      ],
    });
  }

  const whereConditions: Prisma.ChildWhereInput = andConditions.length
    ? { AND: andConditions }
    : {};

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { authId: parentAuthId },
    select: { defaultChildId: true },
  });

  const [rawChildren, total] = await Promise.all([
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

  const data = rawChildren.map(child => ({
    ...child,
    isDefault: child.id === parentProfile?.defaultChildId,
  }));

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
      parents: {
        some: {
          id: parentAuthId,
        },
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
      parents: {
        some: {
          id: parentAuthId,
        },
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

const updateDefaultChildId = async (childId: string, parentAuthId: string) => {
  await prisma.child.findUniqueOrThrow({
    where: {
      id: childId,
      parents: {
        some: { id: parentAuthId },
      },
    },
  });

  const result = await prisma.parentProfile.update({
    where: { authId: parentAuthId },
    data: {
      defaultChildId: childId,
    },
  });

  return result;
};

const addNewParent = async (payload: TUpdateNewParent, childId: string) => {
  await prisma.child.findUniqueOrThrow({
    where: {
      id: childId,
    },
  });

  const result = await prisma.child.update({
    where: {
      id: childId,
    },
    data: {
      parents: {
        connect: [{ id: payload.parentId }],
      },
    },
  });

  return result;
};
export const childService = {
  getAllChildren,
  getChildApprovalRequests,
  updateChildStatus,
  getParentsByChildId,
  updateDefaultChildId,
  addNewParent,
};
