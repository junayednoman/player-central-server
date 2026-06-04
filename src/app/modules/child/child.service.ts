import { ChildStatus, Prisma, UserRole } from "@prisma/client";
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

const addChildRequest = async (childId: string, parentAuthId: string) => {
  const child = await prisma.child.findUniqueOrThrow({
    where: {
      id: childId,
      status: ChildStatus.APPROVED,
    },
    select: {
      parents: true,
    },
  });

  if (child.parents.some(parent => parent.id === parentAuthId)) {
    throw new ApiError(400, "This parent already added for this child");
  }

  const result = await prisma.childApprovalRequest.create({
    data: {
      childId: childId,
      requesterParentId: parentAuthId,
    },
  });

  return result;
};

const getChildAddRequests = async (parentAuthId: string) => {
  console.log("parentAuthId", parentAuthId);
  const result = await prisma.childApprovalRequest.findMany({
    where: {
      childId: {
        in: (
          await prisma.child.findMany({
            where: {
              parents: {
                some: { id: parentAuthId },
              },
            },
            select: { id: true },
          })
        ).map(c => c.id),
      },

      NOT: {
        requesterParentId: parentAuthId,
      },
    },
    include: {
      child: {
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
      },
      requesterParent: {
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const updateChildAddRequest = async (
  requestId: string,
  status: "APPROVED" | "REJECTED"
) => {
  const request = await prisma.childApprovalRequest.findUniqueOrThrow({
    where: {
      id: requestId,
    },
  });

  const result = await prisma.$transaction(async tx => {
    if (status === "APPROVED") {
      await tx.child.update({
        where: {
          id: request.childId,
        },
        data: {
          parents: {
            connect: [{ id: request.requesterParentId }],
          },
        },
      });
    }

    return await tx.childApprovalRequest.delete({
      where: {
        id: requestId,
      },
    });
  });

  return result;
};

const getAllAvailableChild = async (parentAuthId: string) => {
  const eighteenYears = new Date();
  eighteenYears.setFullYear(eighteenYears.getFullYear() - 18);
  const child = await prisma.auth.findMany({
    where: {
      role: UserRole.PLAYER,
      playerProfile: {
        dob: {
          gt: eighteenYears,
        },
      },
      playerChildren: {
        none: {
          parents: {
            some: { id: parentAuthId },
          },
        },
      },
    },
    select: {
      id: true,
      email: true,
      profile: true,
      playerChildren: {
        select: {
          id: true,
          childApprovalRequests: {
            where: {
              requesterParentId: parentAuthId,
            },
          },
        },
      },
    },
  });

  const result = child.map(child => ({
    ...child,
    isRequested: child.playerChildren.some(
      pc => pc.childApprovalRequests.length > 0
    ),
  }));

  return result;
};

export const childService = {
  getAllChildren,
  getChildApprovalRequests,
  updateChildStatus,
  getParentsByChildId,
  updateDefaultChildId,
  addNewParent,
  addChildRequest,
  getChildAddRequests,
  updateChildAddRequest,
  getAllAvailableChild,
};
