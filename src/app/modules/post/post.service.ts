import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import { uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import {
  TCreateComment,
  TCreatePost,
  TToggleReaction,
  TUpdateComment,
  TUpdatePost,
} from "./post.validation";
import { getAge } from "../../utils/common.utils";
import {
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
} from "../../utils/stripe";

const create = async (
  playerAuthId: string,
  payload: TCreatePost,
  file: TFile
) => {
  const videoUrl = await uploadToS3(file);

  const playerProfile = await prisma.playerProfile.findUnique({
    where: { authId: playerAuthId },
    select: { dob: true },
  });
  const isMinor = playerProfile?.dob ? getAge(playerProfile.dob) < 18 : false;
  const isPremium = payload.type === "PREMIUM";

  const post = await prisma.post.create({
    data: {
      playerAuthId,
      video: videoUrl,
      status: isPremium ? "PENDING_PAYMENT" : isMinor ? "PENDING" : "APPROVED",
      ...payload,
    },
  });

  if (isPremium) {
    const premiumPostConfig = await prisma.premiumPostConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (!premiumPostConfig) {
      throw new ApiError(400, "Premium post config is not set");
    }

    const amount = premiumPostConfig.price;
    const currency = premiumPostConfig.currency;
    const intent = await createStripePaymentIntent(
      Math.round(amount * 100),
      currency,
      {
        postId: post.id,
        payerAuthId: playerAuthId,
      }
    );

    await prisma.payment.create({
      data: {
        postId: post.id,
        payerAuthId: playerAuthId,
        type: "POST",
        amount,
        currency,
        provider: "stripe",
        providerIntentId: intent.id,
        status: "PENDING",
      },
    });

    return {
      requiresPayment: true,
      requiresApproval: false,
      post,
      payment: {
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        amount,
        currency,
      },
    };
  }

  if (isMinor) {
    await prisma.postApprovalRequest.create({
      data: {
        playerAuthId,
        postId: post.id,
        status: "PENDING",
      },
    });
  }

  return post;
};

const confirmPayment = async (postId: string, payerAuthId: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      playerAuthId: true,
      status: true,
    },
  });

  if (!post) throw new ApiError(404, "Post not found");
  if (post.playerAuthId !== payerAuthId)
    throw new ApiError(403, "Unauthorized");
  if (post.status !== "PENDING_PAYMENT") {
    throw new ApiError(400, "Post is not awaiting payment");
  }

  const payment = await prisma.payment.findUnique({
    where: { postId },
  });

  if (!payment?.providerIntentId) {
    throw new ApiError(404, "Payment intent not found");
  }

  const intent = await retrieveStripePaymentIntent(payment.providerIntentId);
  if (intent.status !== "succeeded") {
    throw new ApiError(400, "Payment not completed");
  }

  const playerProfile = await prisma.playerProfile.findUnique({
    where: { authId: post.playerAuthId },
    select: { dob: true },
  });
  const isMinor = playerProfile?.dob ? getAge(playerProfile.dob) < 18 : false;

  await prisma.$transaction(async tx => {
    await tx.payment.update({
      where: { postId },
      data: { status: "SUCCEEDED" },
    });

    if (isMinor) {
      await tx.post.update({
        where: { id: postId },
        data: { status: "PENDING" },
      });

      const existingApproval = await tx.postApprovalRequest.findFirst({
        where: { postId },
        select: { id: true },
      });

      if (!existingApproval) {
        await tx.postApprovalRequest.create({
          data: {
            playerAuthId: post.playerAuthId,
            postId,
            status: "PENDING",
          },
        });
      }
    } else {
      await tx.post.update({
        where: { id: postId },
        data: { status: "APPROVED" },
      });
    }
  });

  return {
    paymentConfirmed: true,
    status: isMinor ? "PENDING" : "APPROVED",
    requiresApproval: isMinor,
  };
};

const getAll = async (options: TPaginationOptions, userId?: string) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const posts = await prisma.post.findMany({
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
        },
      },
      reactions: userId
        ? {
            where: { authId: userId },
            select: { id: true },
            take: 1,
          }
        : false,
      comments: userId
        ? {
            where: { authorId: userId },
            select: { id: true },
            take: 1,
          }
        : false,
      shares: userId
        ? {
            where: { authId: userId },
            select: { id: true },
            take: 1,
          }
        : false,
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.post.count();

  return {
    meta: {
      page,
      limit: take,
      total,
    },
    posts: posts.map(post => ({
      ...post,
      commentCount: post._count.comments,
      reactionCount: post._count.reactions,
      isReacted: userId ? (post.reactions?.length ?? 0) > 0 : false,
      isCommented: userId ? (post.comments?.length ?? 0) > 0 : false,
      isShared: userId ? (post.shares?.length ?? 0) > 0 : false,
      _count: undefined,
      reactions: undefined,
      comments: undefined,
      shares: undefined,
    })),
  };
};

const update = async (
  postId: string,
  playerAuthId: string,
  payload: TUpdatePost,
  file?: TFile
) => {
  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) throw new ApiError(404, "Post not found");
  if (existing.playerAuthId !== playerAuthId)
    throw new ApiError(403, "Unauthorized");

  const data: TUpdatePost & { video?: string } = { ...payload };
  if (file) {
    data.video = await uploadToS3(file);
  }

  return prisma.post.update({
    where: { id: postId },
    data,
  });
};

const remove = async (postId: string, playerAuthId: string) => {
  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) throw new ApiError(404, "Post not found");
  if (existing.playerAuthId !== playerAuthId)
    throw new ApiError(403, "Unauthorized");

  return prisma.post.delete({ where: { id: postId } });
};

const incrementShare = async (postId: string, authId: string) => {
  return prisma.$transaction(async tx => {
    const existing = await tx.postShare.findUnique({
      where: { postId_authId: { postId, authId } },
      select: { id: true },
    });

    if (existing) {
      return tx.post.findUnique({ where: { id: postId } });
    }

    await tx.postShare.create({
      data: { postId, authId },
    });

    return tx.post.update({
      where: { id: postId },
      data: { shareCount: { increment: 1 } },
    });
  });
};

const addComment = async (
  postId: string,
  authorId: string,
  payload: TCreateComment
) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError(404, "Post not found");

  return prisma.comment.create({
    data: {
      postId,
      authorId,
      text: payload.text,
    },
  });
};

const updateComment = async (
  commentId: string,
  authorId: string,
  payload: TUpdateComment
) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new ApiError(404, "Comment not found");
  if (comment.authorId !== authorId) throw new ApiError(403, "Unauthorized");

  return prisma.comment.update({
    where: { id: commentId },
    data: {
      text: payload.text,
      isEdited: true,
    },
  });
};

const removeComment = async (commentId: string, authorId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new ApiError(404, "Comment not found");
  if (comment.authorId !== authorId) throw new ApiError(403, "Unauthorized");

  return prisma.comment.delete({ where: { id: commentId } });
};

const toggleReaction = async (
  postId: string,
  authId: string,
  _payload: TToggleReaction
) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError(404, "Post not found");

  const existing = await prisma.reaction.findFirst({
    where: { postId, authId },
    select: { id: true },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return { reacted: false };
  }

  await prisma.reaction.create({
    data: { postId, authId },
  });

  return { reacted: true };
};

export const postServices = {
  create,
  confirmPayment,
  getAll,
  update,
  remove,
  incrementShare,
  addComment,
  updateComment,
  removeComment,
  toggleReaction,
};
