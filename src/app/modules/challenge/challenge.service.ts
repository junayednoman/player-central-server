import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import { uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { getAge } from "../../utils/common.utils";
import {
  TCreateChallenge,
  TSubmitChallenge,
  TUpdateChallenge,
} from "./challenge.validation";

const challengeBookmarkModel = (prisma as any).challengeBookmark as {
  findUnique: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  findMany: (args: any) => Promise<any[]>;
  count: (args: any) => Promise<number>;
};

const create = async (
  coachAuthId: string,
  payload: TCreateChallenge,
  file: TFile
) => {
  const videoUrl = await uploadToS3(file);
  const challenge = await prisma.challenge.create({
    data: {
      coachAuthId,
      video: videoUrl,
      ...payload,
    },
  });
  return challenge;
};

const getAll = async (options: TPaginationOptions) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const challenges = await prisma.challenge.findMany({
    include: {
      coach: {
        select: {
          profile: {
            select: { name: true, image: true },
          },
        },
      },
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.challenge.count();

  return {
    meta: {
      page,
      limit: take,
      total,
    },
    challenges,
  };
};

const getSingle = async (id: string) => {
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      coach: {
        select: {
          profile: {
            select: { name: true, image: true },
          },
        },
      },
    },
  });
  if (!challenge) throw new ApiError(404, "Challenge not found");

  const [acceptedCount, acceptedPreview] = await Promise.all([
    prisma.challengeSubmission.count({ where: { challengeId: id } }),
    prisma.challengeSubmission.findMany({
      where: { challengeId: id },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        player: {
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
  ]);

  return {
    ...challenge,
    acceptedCount,
    acceptedPreview: acceptedPreview
      .map(item => item.player?.profile)
      .filter(Boolean),
  };
};

const update = async (
  id: string,
  coachAuthId: string,
  payload: TUpdateChallenge
) => {
  const existing = await prisma.challenge.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Challenge not found");
  if (existing.coachAuthId !== coachAuthId)
    throw new ApiError(403, "Unauthorized");

  return prisma.challenge.update({
    where: { id },
    data: payload,
  });
};

const remove = async (id: string, coachAuthId: string) => {
  const existing = await prisma.challenge.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Challenge not found");
  if (existing.coachAuthId !== coachAuthId)
    throw new ApiError(403, "Unauthorized");

  return prisma.challenge.delete({ where: { id } });
};

const submit = async (
  challengeId: string,
  playerId: string,
  _payload: TSubmitChallenge,
  file: TFile
) => {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });
  if (!challenge) throw new ApiError(404, "Challenge not found");

  const player = await prisma.auth.findUnique({
    where: { id: playerId },
    select: { id: true, role: true },
  });
  if (!player) throw new ApiError(404, "Player not found");
  if (player.role !== "PLAYER") throw new ApiError(403, "Unauthorized");

  const playerProfile = await prisma.playerProfile.findUnique({
    where: { authId: playerId },
    select: { dob: true },
  });

  const isMinor = playerProfile?.dob ? getAge(playerProfile.dob) < 18 : false;
  const videoUrl = await uploadToS3(file);

  if (isMinor) {
    const approvalRequest = await prisma.challengeApprovalRequest.create({
      data: {
        playerAuthId: playerId,
        challengeId,
        video: videoUrl,
        status: "PENDING",
      },
    });

    return {
      requiresApproval: true,
      approvalRequest,
    };
  }

  const submission = await prisma.challengeSubmission.create({
    data: {
      challengeId,
      playerId,
      video: videoUrl,
    },
  });

  return {
    requiresApproval: false,
    submission,
  };
};

const getCoachSubmissions = async (
  coachAuthId: string,
  options: TPaginationOptions
) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const submissions = await prisma.challengeSubmission.findMany({
    where: {
      challenge: {
        coachAuthId,
      },
    },
    include: {
      challenge: {
        select: {
          difficulty: true,
        },
      },
      player: {
        select: {
          id: true,
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
          followingRelations: {
            where: { followerAuthId: coachAuthId },
            select: { id: true },
            take: 1,
          },
          playerBookmarks: {
            where: { coachAuthId },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.challengeSubmission.count({
    where: {
      challenge: {
        coachAuthId,
      },
    },
  });

  return {
    meta: {
      page,
      limit: take,
      total,
    },
    submissions: submissions.map(submission => ({
      id: submission.id,
      video: submission.video,
      challenge: submission.challenge,
      player: submission.player
        ? {
            id: submission.player.id,
            profile: submission.player.profile,
          }
        : null,
      isFollowing: (submission.player?.followingRelations?.length ?? 0) > 0,
      isBookmarked: (submission.player?.playerBookmarks?.length ?? 0) > 0,
    })),
  };
};

const toggleBookmark = async (challengeId: string, playerAuthId: string) => {
  const [challenge, player] = await Promise.all([
    prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { id: true },
    }),
    prisma.auth.findUnique({
      where: { id: playerAuthId },
      select: { id: true, role: true },
    }),
  ]);

  if (!challenge) throw new ApiError(404, "Challenge not found");
  if (!player || player.role !== "PLAYER")
    throw new ApiError(403, "Unauthorized");

  const existing = await challengeBookmarkModel.findUnique({
    where: {
      challengeId_playerAuthId: {
        challengeId,
        playerAuthId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await challengeBookmarkModel.delete({
      where: { id: existing.id },
    });

    return { bookmarked: false };
  }

  await challengeBookmarkModel.create({
    data: {
      challengeId,
      playerAuthId,
    },
  });

  return { bookmarked: true };
};

const getMyBookmarkedChallenges = async (
  playerAuthId: string,
  options: TPaginationOptions
) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);
  const safeSortBy = sortBy === "bookmarkedAt" ? "createdAt" : sortBy;

  const bookmarks = await challengeBookmarkModel.findMany({
    where: { playerAuthId },
    include: {
      challenge: {
        include: {
          coach: {
            select: {
              profile: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              submissions: true,
              reactions: true,
              comments: true,
            },
          },
        },
      },
    },
    skip,
    take,
    orderBy: safeSortBy && orderBy ? { [safeSortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await challengeBookmarkModel.count({
    where: { playerAuthId },
  });

  return {
    meta: {
      page,
      limit: take,
      total,
    },
    challenges: bookmarks.map(bookmark => ({
      ...bookmark.challenge,
      submissionCount: bookmark.challenge._count.submissions,
      reactionCount: bookmark.challenge._count.reactions,
      commentCount: bookmark.challenge._count.comments,
      isBookmarked: true,
      bookmarkedAt: bookmark.createdAt,
      _count: undefined,
    })),
  };
};

export const challengeServices = {
  create,
  getAll,
  getSingle,
  update,
  remove,
  submit,
  toggleBookmark,
  getMyBookmarkedChallenges,
  getCoachSubmissions,
};
