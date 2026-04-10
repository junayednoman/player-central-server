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

type TEarningStatsQuery = {
  page?: number;
  limit?: number;
  searchTerm?: string;
  type?: "COACH_SUBSCRIPTION" | "SCOUT_SUBSCRIPTION" | "PREMIUM_CONTENT";
  year?: number;
  month?: number;
  dateFrom?: Date;
  dateTo?: Date;
};

const getEarningStats = async (query: TEarningStatsQuery) => {
  const { page = 1, limit = 10, searchTerm, type, year, month, dateFrom, dateTo } =
    query;

  const { take, skip } = {
    take: Number(limit),
    skip: (Number(page) - 1) * Number(limit),
  };

  const dateConditions: Prisma.PaymentWhereInput[] = [];

  if (dateFrom || dateTo) {
    dateConditions.push({
      createdAt: {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      },
    });
  }

  if (year) {
    const startDate = new Date(Date.UTC(year, month ? month - 1 : 0, 1));
    const endDate = month
      ? new Date(Date.UTC(year, month, 1))
      : new Date(Date.UTC(year + 1, 0, 1));

    dateConditions.push({
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    });
  }

  const baseWhere: Prisma.PaymentWhereInput = {
    status: "SUCCEEDED",
    ...(dateConditions.length ? { AND: dateConditions } : {}),
  };

  const transactionTypeWhere: Prisma.PaymentWhereInput | undefined =
    type === "PREMIUM_CONTENT"
      ? {
          type: "POST",
        }
      : type === "COACH_SUBSCRIPTION"
        ? {
            type: "SUBSCRIPTION",
            payer: {
              role: UserRole.COACH,
            },
          }
        : type === "SCOUT_SUBSCRIPTION"
          ? {
              type: "SUBSCRIPTION",
              payer: {
                role: UserRole.SCOUT,
              },
            }
          : undefined;

  const searchWhere: Prisma.PaymentWhereInput | undefined = searchTerm
    ? {
        payer: {
          OR: [
            {
              email: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              profile: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
          ],
        },
      }
    : undefined;

  const transactionWhere: Prisma.PaymentWhereInput = {
    AND: [
      baseWhere,
      ...(transactionTypeWhere ? [transactionTypeWhere] : []),
      ...(searchWhere ? [searchWhere] : []),
    ],
  };

  const [allSucceededPayments, allSucceededSubscriptionPayments, transactions, total] =
    await Promise.all([
      prisma.payment.aggregate({
        where: baseWhere,
        _sum: {
          amount: true,
        },
      }),
      prisma.payment.aggregate({
        where: {
          AND: [
            baseWhere,
            {
              type: "SUBSCRIPTION",
            },
          ],
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.payment.findMany({
        where: transactionWhere,
        select: {
          id: true,
          amount: true,
          currency: true,
          type: true,
          createdAt: true,
          payer: {
            select: {
              email: true,
              role: true,
              profile: {
                select: {
                  image: true,
                  name: true,
                },
              },
            },
          },
          subscription: {
            select: {
              auth: {
                select: {
                  role: true,
                },
              },
            },
          },
        },
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.payment.count({
        where: transactionWhere,
      }),
    ]);

  return {
    totalEarning: allSucceededPayments._sum.amount ?? 0,
    totalSubscriptionEarning:
      allSucceededSubscriptionPayments._sum.amount ?? 0,
    transactions: {
      meta: {
        page: Number(page),
        limit: take,
        total,
      },
      data: transactions.map(transaction => ({
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt,
        transactionType:
          transaction.type === "POST"
            ? "PREMIUM_CONTENT"
            : transaction.subscription?.auth.role === UserRole.COACH
              ? "COACH_SUBSCRIPTION"
              : transaction.subscription?.auth.role === UserRole.SCOUT
                ? "SCOUT_SUBSCRIPTION"
                : transaction.type,
        payer: {
          image: transaction.payer.profile?.image ?? null,
          name: transaction.payer.profile?.name ?? null,
          email: transaction.payer.email,
          role: transaction.payer.role,
        },
      })),
    },
  };
};

export const adminServices = {
  getProfile,
  updateProfile,
  getDashboardStats,
  getEarningStats,
};
