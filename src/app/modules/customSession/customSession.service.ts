import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import {
  combineDateAndTime,
  getDayOfWeek,
  isWithinValidRange,
  parseUTCDateOnly,
} from "../../utils/booking.utils";
import { TCreateCustomSession } from "./customSession.validation";

const checkOverlaps = async (
  coachAuthId: string,
  playerAuthIds: string[],
  startAt: Date,
  endAt: Date
) => {
  const conflictCoach = await prisma.sessionBooking.findFirst({
    where: {
      coachAuthId,
      OR: [
        { status: { in: ["PENDING", "APPROVED", "UPCOMING"] } },
        { status: "PENDING_PAYMENT", reservedUntil: { gt: new Date() } },
      ],
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });
  if (conflictCoach) {
    throw new ApiError(409, "You already have a session at this time");
  }

  const conflictCustomCoach = await prisma.customSessionBooking.findFirst({
    where: {
      coachAuthId,
      status: { in: ["PENDING", "APPROVED", "UPCOMING"] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });
  if (conflictCustomCoach) {
    throw new ApiError(409, "You already have a custom session at this time");
  }

  if (playerAuthIds.length) {
    const conflictPlayers = await prisma.sessionBooking.findFirst({
      where: {
        playerAuthId: { in: playerAuthIds },
        OR: [
          { status: { in: ["PENDING", "APPROVED", "UPCOMING"] } },
          { status: "PENDING_PAYMENT", reservedUntil: { gt: new Date() } },
        ],
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (conflictPlayers) {
      throw new ApiError(409, "One or more players have a conflicting session");
    }

    const conflictCustomPlayers = await prisma.customSessionBooking.findFirst({
      where: {
        playerAuthIds: { hasSome: playerAuthIds },
        status: { in: ["PENDING", "APPROVED", "UPCOMING"] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (conflictCustomPlayers) {
      throw new ApiError(409, "One or more players have a conflicting session");
    }
  }
};

const resolveSlot = async (availabilityBlockId: string, date?: string) => {
  const block = await prisma.coachAvailabilityBlock.findUnique({
    where: { id: availabilityBlockId },
  });
  if (!block) throw new ApiError(404, "Availability block not found");
  if (block.type !== "AVAILABLE")
    throw new ApiError(400, "Selected slot is not available");

  let startAt: Date;
  let endAt: Date;

  if (block.isRecurring) {
    if (!date) throw new ApiError(400, "Date is required for recurring slots");
    if (!block.startTime || !block.endTime)
      throw new ApiError(400, "Invalid availability block");
    const day = parseUTCDateOnly(date);
    if (!day) throw new ApiError(400, "Invalid date format (YYYY-MM-DD)");
    if (block.dayOfWeek !== getDayOfWeek(day))
      throw new ApiError(400, "Date does not match slot day");
    if (!isWithinValidRange(day, block.validFrom, block.validUntil))
      throw new ApiError(400, "Date is outside of slot validity");
    startAt = combineDateAndTime(day, block.startTime);
    endAt = combineDateAndTime(day, block.endTime);
  } else {
    if (!block.startAt || !block.endAt)
      throw new ApiError(400, "Invalid availability block");
    startAt = block.startAt;
    endAt = block.endAt;
  }

  return { block, startAt, endAt };
};

const create = async (coachAuthId: string, payload: TCreateCustomSession) => {
  const { block, startAt, endAt } = await resolveSlot(
    payload.availabilityBlockId,
    payload.date
  );

  if (block.coachAuthId !== coachAuthId) {
    throw new ApiError(403, "Unauthorized");
  }

  const playerAuthIds = payload.playerAuthIds ?? [];

  await checkOverlaps(coachAuthId, playerAuthIds, startAt, endAt);

  return prisma.customSessionBooking.create({
    data: {
      coachAuthId,
      playerAuthIds,
      sessionType: payload.sessionType,
      maxPlayers: payload.maxPlayers,
      mode: payload.mode,
      startAt,
      endAt,
      status: "PENDING",
    },
  });
};

const getAll = async (
  authId: string,
  role: string,
  options: TPaginationOptions
) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);
  const safeSortBy = sortBy === "createdAt" ? "bookedAt" : sortBy;

  const where =
    role === "COACH"
      ? { coachAuthId: authId }
      : { playerAuthIds: { has: authId } };

  const sessions = await prisma.customSessionBooking.findMany({
    where,
    include: {
      coach: {
        select: { id: true, profile: { select: { name: true, image: true } } },
      },
    },
    skip,
    take,
    orderBy:
      safeSortBy && orderBy ? { [safeSortBy]: orderBy } : { bookedAt: "desc" },
  });

  const total = await prisma.customSessionBooking.count({ where });

  return {
    meta: { page, limit: take, total },
    sessions,
  };
};

export const customSessionServices = {
  create,
  getAll,
};
