import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TUpdatePostApprovalStatus } from "./postApprovalRequest.validation";

const getAll = async (playerAuthId: string, options: TPaginationOptions) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const requests = await prisma.postApprovalRequest.findMany({
    where: { playerAuthId },
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
    where: { playerAuthId },
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
    await tx.postApprovalRequest.delete({
      where: { id: requestId },
    });

    if (payload.status === "APPROVED") {
      await tx.post.update({
        where: { id: request.postId },
        data: { status: "APPROVED" },
      });
    } else if (payload.status === "REJECTED") {
      console.log("hitting here");
      await tx.payment.deleteMany({
        where: { postId: request.postId },
      });

      await tx.post.delete({
        where: { id: request.postId },
      });
    }

    return { status: payload.status };
  });
};

export const postApprovalRequestServices = {
  getAll,
  updateStatus,
};
