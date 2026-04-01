import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import { uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TCreatePost, TUpdatePost } from "./post.validation";

const create = async (playerAuthId: string, payload: TCreatePost, file: TFile) => {
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

const getAll = async (options: TPaginationOptions) => {
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
      _count: undefined,
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

const incrementShare = async (postId: string) => {
  return prisma.post.update({
    where: { id: postId },
    data: { shareCount: { increment: 1 } },
  });
};

export const postServices = {
  create,
  getAll,
  update,
  remove,
  incrementShare,
};
