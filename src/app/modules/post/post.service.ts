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
  TUpdateComment,
  TUpdatePost,
} from "./post.validation";

const create = async (
  playerAuthId: string,
  payload: TCreatePost,
  file: TFile
) => {
  const videoUrl = await uploadToS3(file);

  const post = await prisma.post.create({
    data: {
      playerAuthId,
      video: videoUrl,
      status: "PENDING",
      ...payload,
    },
  });

  return post;
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

export const postServices = {
  create,
  getAll,
  update,
  remove,
  incrementShare,
  addComment,
  updateComment,
  removeComment,
};
