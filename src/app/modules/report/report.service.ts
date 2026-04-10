import ApiError from "../../classes/ApiError";
import { deleteFromS3 } from "../../utils/awss3";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import prisma from "../../utils/prisma";
import { TCreateReport } from "./report.validation";

type TReportContentType = "COMMUNITY_POST" | "PREMIUM_POST" | "CHALLENGE";

const reportModel = (prisma as any).report;

const create = async (reporterAuthId: string, payload: TCreateReport) => {
  if (payload.postId) {
    const post = await prisma.post.findUnique({
      where: { id: payload.postId },
      select: {
        id: true,
        type: true,
      },
    });

    if (!post) throw new ApiError(404, "Post not found");

    const existing = await reportModel.findFirst({
      where: {
        reporterAuthId,
        postId: payload.postId,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError(409, "You have already reported this post");
    }

    return reportModel.create({
      data: {
        reporterAuthId,
        reason: payload.reason,
        postId: payload.postId,
        contentType:
          post.type === "PREMIUM" ? "PREMIUM_POST" : "COMMUNITY_POST",
      },
    });
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id: payload.challengeId },
    select: { id: true },
  });

  if (!challenge) throw new ApiError(404, "Challenge not found");

  const existing = await reportModel.findFirst({
    where: {
      reporterAuthId,
      challengeId: payload.challengeId,
    },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(409, "You have already reported this challenge");
  }

  return reportModel.create({
    data: {
      reporterAuthId,
      reason: payload.reason,
      challengeId: payload.challengeId,
      contentType: "CHALLENGE",
    },
  });
};

const getAll = async (
  options: TPaginationOptions,
  query: {
    type?: TReportContentType;
  }
) => {
  const { page, take, skip } = calculatePagination(options);

  const where: Record<string, unknown> = {
    ...(query.type ? { contentType: query.type } : {}),
  };

  const reports = await reportModel.findMany({
    where,
    include: {
      reporter: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
      post: {
        select: {
          id: true,
          caption: true,
          video: true,
          type: true,
          status: true,
          createdAt: true,
          player: {
            select: {
              id: true,
              email: true,
              role: true,
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
      challenge: {
        select: {
          id: true,
          title: true,
          video: true,
          difficulty: true,
          createdAt: true,
          coach: {
            select: {
              id: true,
              email: true,
              role: true,
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
    },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

  const total = await reportModel.count({ where });

  return {
    meta: {
      page,
      limit: take,
      total,
    },
    reports,
  };
};

const removeContent = async (contentId: string, type: TReportContentType) => {
  if (type === "CHALLENGE") {
    const challenge = await prisma.challenge.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        video: true,
        submissions: {
          select: {
            id: true,
            video: true,
          },
        },
        approvalRequests: {
          select: {
            id: true,
            video: true,
          },
        },
      },
    });

    if (!challenge) throw new ApiError(404, "Challenge not found");

    await prisma.$transaction(async tx => {
      await tx.challengeComment.deleteMany({
        where: {
          challengeId: contentId,
        },
      });

      await tx.challengeReaction.deleteMany({
        where: {
          challengeId: contentId,
        },
      });

      await tx.challengeSubmission.deleteMany({
        where: {
          challengeId: contentId,
        },
      });

      await tx.challengeApprovalRequest.deleteMany({
        where: {
          challengeId: contentId,
        },
      });

      await (tx as any).report.deleteMany({
        where: {
          challengeId: contentId,
        },
      });

      await tx.challenge.delete({
        where: {
          id: contentId,
        },
      });
    });

    if (challenge.video) {
      await deleteFromS3(challenge.video);
    }

    await Promise.all(
      challenge.submissions
        .map(submission => submission.video)
        .filter(Boolean)
        .map(video => deleteFromS3(video))
    );

    await Promise.all(
      challenge.approvalRequests
        .map(approvalRequest => approvalRequest.video)
        .filter((video): video is string => Boolean(video))
        .map(video => deleteFromS3(video))
    );

    return { deleted: true, type };
  }

  const post = await prisma.post.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      video: true,
      approvalRequests: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!post) throw new ApiError(404, "Post not found");

  await prisma.$transaction(async tx => {
    await tx.comment.deleteMany({
      where: {
        postId: contentId,
      },
    });

    await tx.reaction.deleteMany({
      where: {
        postId: contentId,
      },
    });

    await tx.postShare.deleteMany({
      where: {
        postId: contentId,
      },
    });

    await tx.postApprovalRequest.deleteMany({
      where: {
        postId: contentId,
      },
    });

    await tx.payment.deleteMany({
      where: {
        postId: contentId,
      },
    });

    await (tx as any).report.deleteMany({
      where: {
        postId: contentId,
      },
    });

    await tx.post.delete({
      where: {
        id: contentId,
      },
    });
  });

  if (post.video) {
    await deleteFromS3(post.video);
  }

  return { deleted: true, type };
};

export const reportServices = {
  create,
  getAll,
  removeContent,
};
