import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import { Prisma, UserRole, UserStatus } from "@prisma/client";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TToggleFollowing } from "./following.validation";

const allowedFollowingTargets: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: [],
  [UserRole.PLAYER]: [UserRole.PLAYER, UserRole.COACH],
  [UserRole.COACH]: [UserRole.PLAYER, UserRole.COACH],
  [UserRole.PARENT]: [UserRole.COACH],
  [UserRole.SCOUT]: [],
};

const toggle = async (followerAuthId: string, payload: TToggleFollowing) => {
  const followingAuthId = payload.userId;
  if (followerAuthId === followingAuthId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const [follower, target] = await Promise.all([
    prisma.auth.findUnique({
      where: { id: followerAuthId },
      select: { id: true, role: true },
    }),
    prisma.auth.findUnique({
      where: { id: followingAuthId },
      select: { id: true, role: true },
    }),
  ]);

  if (!follower) throw new ApiError(404, "Follower not found");
  if (!target) throw new ApiError(404, "User not found");

  const allowedTargets = allowedFollowingTargets[follower.role] ?? [];
  if (!allowedTargets.includes(target.role)) {
    throw new ApiError(
      403,
      `${follower.role} cannot follow ${target.role}`
    );
  }

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

const getSuggestedUsers = async (
  userId: string,
  options: TPaginationOptions
) => {
  const currentUser = await prisma.auth.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!currentUser) throw new ApiError(404, "User not found");

  const allowedTargets = allowedFollowingTargets[currentUser.role] ?? [];
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);
  const safeSortBy = sortBy === "createdAt" ? "id" : sortBy;

  if (allowedTargets.length === 0) {
    return {
      meta: { page, limit: take, total: 0 },
      users: [],
    };
  }

  const where: Prisma.AuthWhereInput = {
    id: { not: userId },
    role: { in: allowedTargets },
    status: UserStatus.ACTIVE,
    NOT: {
      followingRelations: {
        some: {
          followerAuthId: userId,
        },
      },
    },
  };

  const [users, total] = await Promise.all([
    prisma.auth.findMany({
      where,
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
      skip,
      take,
      orderBy:
        safeSortBy && orderBy ? { [safeSortBy]: orderBy } : { id: "desc" },
    }),
    prisma.auth.count({
      where,
    }),
  ]);

  return {
    meta: { page, limit: take, total },
    users,
  };
};

export const followingServices = {
  toggle,
  getFollowing,
  getFollowers,
  getSuggestedUsers,
};
