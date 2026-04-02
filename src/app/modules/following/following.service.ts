import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TToggleFollowing } from "./following.validation";

const toggle = async (followerAuthId: string, payload: TToggleFollowing) => {
  const followingAuthId = payload.userId;
  if (followerAuthId === followingAuthId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const target = await prisma.auth.findUnique({
    where: { id: followingAuthId },
    select: { id: true },
  });
  if (!target) throw new ApiError(404, "User not found");

  const existing = await prisma.following.findFirst({
    where: {
      followerAuthId,
      followingAuthId,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.following.delete({ where: { id: existing.id } });
    return { following: false };
  }

  await prisma.following.create({
    data: {
      followerAuthId,
      followingAuthId,
    },
  });

  return { following: true };
};

const getFollowing = async (userId: string, options: TPaginationOptions) => {
  const user = await prisma.auth.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) throw new ApiError(404, "User not found");

  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);
  const safeSortBy = sortBy === "createdAt" ? "id" : sortBy;

  const following = await prisma.following.findMany({
    where: { followerAuthId: userId },
    include: {
      following: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, image: true } },
          role: true,
        },
      },
    },
    skip,
    take,
    orderBy:
      safeSortBy && orderBy ? { [safeSortBy]: orderBy } : { id: "desc" },
  });

  const total = await prisma.following.count({
    where: { followerAuthId: userId },
  });

  return {
    meta: { page, limit: take, total },
    following: following.map(f => f.following),
  };
};

const getFollowers = async (userId: string, options: TPaginationOptions) => {
  const user = await prisma.auth.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) throw new ApiError(404, "User not found");

  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);
  const safeSortBy = sortBy === "createdAt" ? "id" : sortBy;

  const followers = await prisma.following.findMany({
    where: { followingAuthId: userId },
    include: {
      follower: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, image: true } },
          role: true,
        },
      },
    },
    skip,
    take,
    orderBy:
      safeSortBy && orderBy ? { [safeSortBy]: orderBy } : { id: "desc" },
  });

  const total = await prisma.following.count({
    where: { followingAuthId: userId },
  });

  return {
    meta: { page, limit: take, total },
    followers: followers.map(f => f.follower),
  };
};

export const followingServices = {
  toggle,
  getFollowing,
  getFollowers,
};
