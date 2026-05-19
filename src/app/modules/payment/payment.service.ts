import prisma from "../../utils/prisma";
import { Prisma } from "@prisma/client";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const getCoachPayments = async (
  coachId: string,
  options: TPaginationOptions,
  year?: number,
  month?: number
) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);
  const andConditions: Prisma.SessionBookingWhereInput[] = [
    { coachAuthId: coachId },
  ];

  if (year !== undefined) {
    const filterMonth = month ?? 1;
    andConditions.push({
      startAt: {
        gte: new Date(year, filterMonth - 1, 1, 0, 0, 0, 0),
        lt: new Date(year, filterMonth, 1, 0, 0, 0, 0),
      },
    });
  }

  const where: Prisma.SessionBookingWhereInput = { AND: andConditions };

  const [bookings, total] = await Promise.all([
    prisma.sessionBooking.findMany({
      where,
      include: {
        payment: {
          where: { status: { in: ["SUCCEEDED", "PENDING"] as const } },
        },
        player: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true } },
          },
        },
      },
      skip,
      take,
      orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { startAt: "desc" },
    }),
    prisma.sessionBooking.count({ where }),
  ]);

  const payments = bookings
    .filter(b => b.payment !== null)
    .map(b => ({
      id: b.payment!.id,
      payerEmail: b.player.email,
      payerName: b.player.profile?.name ?? "Unknown",
      sessionType: b.sessionType,
      sessionMode: b.sessionMode,
      date: b.startAt,
      amount: b.payment!.amount,
      currency: b.payment!.currency,
      status: b.payment!.status,
    }));

  return {
    meta: { page, limit: take, total },
    payments,
  };
};

const getCoachTotalEarnings = async (
  coachId: string,
  year?: number,
  month?: number
) => {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;

  const gte = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
  const lt = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: {
      booking: { coachAuthId: coachId },
      status: { in: ["SUCCEEDED", "PENDING"] as const },
      createdAt: { gte, lt },
    },
    select: { amount: true },
  });

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    total,
    currency: "usd" as const,
    year: targetYear,
    month: targetMonth,
  };
};

const getCoachMonthlyEarnings = async (coachId: string, year?: number) => {
  const targetYear = year ?? new Date().getFullYear();

  const start = new Date(targetYear, 0, 1, 0, 0, 0, 0);
  const end = new Date(targetYear, 11, 31, 23, 59, 59, 999);

  const all = await prisma.payment.findMany({
    where: {
      booking: { coachAuthId: coachId },
      status: { in: ["SUCCEEDED", "PENDING"] as const },
      createdAt: { gte: start, lte: end },
    },
    select: { amount: true, createdAt: true },
  });

  const monthMap = new Map<number, number>();
  for (const p of all) {
    const m = p.createdAt.getMonth() + 1;
    monthMap.set(m, (monthMap.get(m) ?? 0) + p.amount);
  }

  return MONTH_NAMES.map((name, idx) => ({
    month: name,
    value: monthMap.get(idx + 1) ?? 0,
  }));
};

export const paymentServices = {
  getCoachPayments,
  getCoachTotalEarnings,
  getCoachMonthlyEarnings,
};
