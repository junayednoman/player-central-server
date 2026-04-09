import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TSendInvitation } from "./invitation.validation";

const send = async (scoutAuthId: string, payload: TSendInvitation) => {
  if (scoutAuthId === payload.playerId) {
    throw new ApiError(400, "You cannot invite yourself");
  }

  const player = await prisma.auth.findUnique({
    where: { id: payload.playerId },
    select: { id: true, role: true },
  });

  if (!player || player.role !== "PLAYER") {
    throw new ApiError(404, "Player not found");
  }

  return prisma.invitation.create({
    data: {
      scoutAuthId,
      playerAuthId: payload.playerId,
      trialDate: payload.trialDate,
      street: payload.street,
      buildingNumber: payload.buildingNumber,
      postCode: payload.postCode,
      instruction: payload.instruction,
    },
    include: {
      player: {
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
  });
};

const getSent = async (scoutAuthId: string, options: TPaginationOptions) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);
  const safeSortBy = sortBy === "createdAt" ? "sentAt" : sortBy;

  const invitations = await prisma.invitation.findMany({
    where: { scoutAuthId },
    include: {
      player: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
          playerProfile: {
            select: {
              position: true,
            },
          },
        },
      },
    },
    skip,
    take,
    orderBy:
      safeSortBy && orderBy ? { [safeSortBy]: orderBy } : { sentAt: "desc" },
  });

  const total = await prisma.invitation.count({
    where: { scoutAuthId },
  });

  return {
    meta: { page, limit: take, total },
    invitations,
  };
};

const getReceived = async (playerAuthId: string, options: TPaginationOptions) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);
  const safeSortBy = sortBy === "createdAt" ? "sentAt" : sortBy;

  const invitations = await prisma.invitation.findMany({
    where: { playerAuthId },
    include: {
      scout: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
          scoutProfile: {
            select: {
              organization: true,
              badge: true,
              level: true,
            },
          },
        },
      },
    },
    skip,
    take,
    orderBy:
      safeSortBy && orderBy ? { [safeSortBy]: orderBy } : { sentAt: "desc" },
  });

  const total = await prisma.invitation.count({
    where: { playerAuthId },
  });

  return {
    meta: { page, limit: take, total },
    invitations,
  };
};

export const invitationServices = {
  send,
  getSent,
  getReceived,
};
