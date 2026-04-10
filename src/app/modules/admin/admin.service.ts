import { Prisma, SubscriptionStatus, UserRole } from "@prisma/client";
import { TFile } from "../../interface/file.interface";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import prisma from "../../utils/prisma";

const getProfile = async (authId: string) => {
  const profile = await prisma.profile.findUniqueOrThrow({
    where: {
      authId,
    },
  });

  return profile;
};

const updateProfile = async (
  authId: string,
  payload: Prisma.ProfileUpdateInput,
  file?: TFile
) => {
  const profile = await prisma.profile.findUniqueOrThrow({
    where: {
      authId,
    },
  });

  if (file) {
    payload.image = await uploadToS3(file);
  }

  const result = await prisma.profile.update({
    where: {
      authId,
    },
    data: payload,
  });

  if (result && payload.image && profile.image) {
    await deleteFromS3(profile.image);
  }

  return result;
};

const getDashboardStats = async (year: number) => {
  const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));

  const [totalPlayers, totalCoaches, totalScouts, totalSubscribedUsers, rawUserOverview] =
    await Promise.all([
      prisma.auth.count({
        where: {
          role: UserRole.PLAYER,
        },
      }),
      prisma.auth.count({
        where: {
          role: UserRole.COACH,
        },
      }),
      prisma.auth.count({
        where: {
          role: UserRole.SCOUT,
        },
      }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
        },
      }),
      prisma.$queryRaw<Array<{ month: number; users: bigint }>>`
        SELECT
          EXTRACT(MONTH FROM "createdAt")::int AS month,
          COUNT(*)::bigint AS users
        FROM "auth"
        WHERE "createdAt" >= ${startDate}
          AND "createdAt" < ${endDate}
          AND role <> 'ADMIN'
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

  const monthMap = new Map(
    rawUserOverview.map(item => [item.month, Number(item.users)])
  );

  const userOverview = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    users: monthMap.get(index + 1) ?? 0,
  }));

  return {
    totalPlayers,
    totalCoaches,
    totalScouts,
    totalSubscribedUsers,
    userOverview,
  };
};

export const adminServices = {
  getProfile,
  updateProfile,
  getDashboardStats,
};
