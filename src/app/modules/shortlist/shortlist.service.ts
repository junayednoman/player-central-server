import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TToggleShortlist } from "./shortlist.validation";

const toggle = async (scoutAuthId: string, payload: TToggleShortlist) => {
  const playerAuthId = payload.playerId;

  if (scoutAuthId === playerAuthId) {
    throw new ApiError(400, "You cannot shortlist yourself");
  }

  const player = await prisma.auth.findUnique({
    where: { id: playerAuthId },
    select: { id: true, role: true },
  });

  if (!player || player.role !== "PLAYER") {
    throw new ApiError(404, "Player not found");
  }

  const existing = await prisma.playerShortlist.findFirst({
    where: {
      scoutAuthId,
      playerAuthId,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.playerShortlist.delete({
      where: { id: existing.id },
    });
    return { shortlisted: false };
  }

  await prisma.playerShortlist.create({
    data: {
      scoutAuthId,
      playerAuthId,
    },
  });

  return { shortlisted: true };
};

const getShortlistedPlayers = async (
  scoutAuthId: string,
  options: TPaginationOptions
) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);
  const safeSortBy = sortBy === "shortlistedAt" ? "createdAt" : sortBy;

  const shortlists = (await prisma.playerShortlist.findMany({
    where: { scoutAuthId },
    include: {
      player: {
        select: {
          id: true,
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
          followerRelations: {
            select: { id: true },
          },
          playerShortlists: {
            select: { id: true },
          },
        },
      },
    },
    skip,
    take,
    orderBy: safeSortBy && orderBy ? { [safeSortBy]: orderBy } : { id: "desc" },
  })) as Array<{
    createdAt?: Date;
    player: {
      id: string;
      profile: { name: string; image: string } | null;
      playerProfile: { position: string } | null;
      followerRelations: Array<{ id: string }>;
      playerShortlists: Array<{ id: string }>;
    };
  }>;

  const total = await prisma.playerShortlist.count({
    where: { scoutAuthId },
  });

  return {
    meta: { page, limit: take, total },
    players: shortlists.map(shortlist => ({
      id: shortlist.player.id,
      name: shortlist.player.profile?.name ?? null,
      image: shortlist.player.profile?.image ?? null,
      followerCount: shortlist.player.followerRelations.length,
      position: shortlist.player.playerProfile?.position ?? null,
      shortlistCount: shortlist.player.playerShortlists.length,
      shortlistedAt: shortlist.createdAt ?? null,
    })),
  };
};

export const shortlistServices = {
  toggle,
  getShortlistedPlayers,
};
