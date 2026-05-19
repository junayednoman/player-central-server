import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { deleteFromS3 } from "../../utils/awss3";
import {
  TCreateChallengeApprovalRequest,
  TUpdateChallengeApprovalStatus,
} from "./challengeApprovalRequest.validation";

const getAll = async (playerAuthId: string, options: TPaginationOptions) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const requests = await prisma.challengeApprovalRequest.findMany({
    where: { playerAuthId },
    include: {
      challenge: true,
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

  const total = await prisma.challengeApprovalRequest.count({
    where: { playerAuthId },
  });

  return {
    meta: { page, limit: take, total },
    requests,
  };
};

const create = async (
  playerAuthId: string,
  payload: TCreateChallengeApprovalRequest
) => {
  const challenge = await prisma.challenge.findUnique({
    where: { id: payload.challengeId },
    select: { id: true },
  });
  if (!challenge) throw new ApiError(404, "Challenge not found");

  return prisma.challengeApprovalRequest.create({
    data: {
      playerAuthId,
      challengeId: payload.challengeId,
      video: payload.video,
      status: "PENDING",
    },
  });
};

const updateStatus = async (
  parentAuthId: string,
  requestId: string,
  payload: TUpdateChallengeApprovalStatus
) => {
  const request = await prisma.challengeApprovalRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new ApiError(404, "Challenge approval request not found");

  const isParent = await prisma.child.findFirst({
    where: {
      playerAuthId: request.playerAuthId,
      parents: {
        some: {
          id: parentAuthId,
        },
      },
    },
    select: { id: true },
  });
  if (!isParent) throw new ApiError(403, "Unauthorized");

  return prisma.$transaction(async tx => {
    if (payload.status === "APPROVED") {
      if (!request.video)
        throw new ApiError(400, "Approval request video is missing");
      await tx.challengeSubmission.create({
        data: {
          challengeId: request.challengeId,
          playerId: request.playerAuthId,
          video: request.video,
        },
      });
    } else if (payload.status === "REJECTED") {
      if (request.video) {
        await deleteFromS3(request.video);
      }
      await tx.challengeSubmission.deleteMany({
        where: {
          challengeId: request.challengeId,
          playerId: request.playerAuthId,
          video: request.video ?? undefined,
        },
      });
    }

    await tx.challengeApprovalRequest.delete({
      where: { id: requestId },
    });

    return { status: payload.status };
  });
};

export const challengeApprovalRequestServices = {
  getAll,
  create,
  updateStatus,
};
