import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TUpdatePostApprovalStatus } from "./postApprovalRequest.validation";

const getAll = async (parentAuthId: string, options: TPaginationOptions) => {
  const children = await prisma.child.findMany({
    where: { parentAuthIds: { has: parentAuthId } },
    select: { playerAuthId: true },
  });

  const playerIds = children.map(c => c.playerAuthId);
  if (playerIds.length === 0) {
    return {
      meta: { page: 1, limit: options.limit ?? 10, total: 0 },
      requests: [],
    };
  }

  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const requests = await prisma.postApprovalRequest.findMany({
    where: { playerAuthId: { in: playerIds } },
    include: {
      post: true,
      player: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, image: true } },
        },
      },
    },
    skip,
    take,
    orderBy:
      sortBy && orderBy ? { [sortBy]: orderBy } : { requestedAt: "desc" },
  });

  const total = await prisma.postApprovalRequest.count({
    where: { playerAuthId: { in: playerIds } },
  });

  return {
    meta: { page, limit: take, total },
    requests,
  };
};

const updateStatus = async (
  parentAuthId: string,
  requestId: string,
  payload: TUpdatePostApprovalStatus
) => {
  const request = await prisma.postApprovalRequest.findUnique({
    where: { id: requestId },
    include: { player: true, post: true },
  });
  if (!request) throw new ApiError(404, "Post approval request not found");

  const isParent = await prisma.child.findFirst({
    where: {
      playerAuthId: request.playerAuthId,
      parentAuthIds: { has: parentAuthId },
    },
    select: { id: true },
  });
  if (!isParent) throw new ApiError(403, "Unauthorized");

  return prisma.$transaction(async tx => {
    if (payload.status === "APPROVED") {
      await tx.post.update({
        where: { id: request.postId },
        data: { status: "APPROVED" },
      });
    } else if (payload.status === "REJECTED") {
      await tx.post.delete({
        where: { id: request.postId },
      });
    }

    await tx.postApprovalRequest.delete({
      where: { id: requestId },
    });

    return { status: payload.status };
  });
};

export const postApprovalRequestServices = {
  getAll,
  updateStatus,
};
