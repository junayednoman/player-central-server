import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { parseDate, parseTime } from "../../utils/common.utils";
import {
  combineDateAndTime,
  getDayOfWeek,
  isSameUTCDate,
  isWithinValidRange,
} from "../../utils/booking.utils";
import {
  TCreateCoachAvailability,
  TUpdateCoachProfile,
} from "./coach.validation";

const getAll = async (
  options: TPaginationOptions,
  query: Record<string, any>
) => {
  const andConditions: any[] = [];

  if (query.searchTerm) {
    andConditions.push({
      auth: {
        profile: {
          name: { contains: query.searchTerm, mode: "insensitive" },
        },
      },
    });
  }

  if (query.minPrice || query.maxPrice) {
    const priceFilter: { gte?: number; lte?: number } = {};
    const minPrice = Number(query.minPrice);
    const maxPrice = Number(query.maxPrice);
    if (!Number.isNaN(minPrice)) priceFilter.gte = minPrice;
    if (!Number.isNaN(maxPrice)) priceFilter.lte = maxPrice;
    andConditions.push({ price: priceFilter });
  }

  if (query.minExperience || query.maxExperience) {
    const expFilter: { gte?: number; lte?: number } = {};
    const minExp = Number(query.minExperience);
    const maxExp = Number(query.maxExperience);
    if (!Number.isNaN(minExp)) expFilter.gte = minExp;
    if (!Number.isNaN(maxExp)) expFilter.lte = maxExp;
    andConditions.push({ experience: expFilter });
  }

  if (query.minRating || query.maxRating) {
    const ratingFilter: { gte?: number; lte?: number } = {};
    const minRating = Number(query.minRating);
    const maxRating = Number(query.maxRating);
    if (!Number.isNaN(minRating)) ratingFilter.gte = minRating;
    if (!Number.isNaN(maxRating)) ratingFilter.lte = maxRating;
    andConditions.push({
      auth: {
        coachReviews: {
          some: {
            rating: ratingFilter,
          },
        },
      },
    });
  }

  const whereConditions =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const coaches = await prisma.coachProfile.findMany({
    where: whereConditions,
    include: {
      auth: {
        select: {
          email: true,
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.coachProfile.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit: take,
      total,
    },
    coaches,
  };
};

const getSingle = async (id: string) => {
  const coach = await prisma.coachProfile.findUnique({
    where: { id },
    include: {
      auth: {
        select: {
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!coach) throw new ApiError(404, "Coach not found");

  return coach;
};

const getMyProfile = async (authId: string) => {
  const coach = await prisma.coachProfile.findUnique({
    where: { authId },
    include: {
      auth: {
        select: {
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!coach) throw new ApiError(404, "Coach profile not found");

  return coach;
};

const updateProfile = async (
  authId: string,
  payload: TUpdateCoachProfile,
  file?: TFile
) => {
  const coachProfile = await prisma.coachProfile.findUnique({
    where: { authId },
    include: {
      auth: {
        select: {
          profile: true,
        },
      },
    },
  });

  if (!coachProfile) throw new ApiError(404, "Coach profile not found");

  const imageUrl = file ? await uploadToS3(file) : undefined;

  const result = await prisma.$transaction(async tx => {
    if (payload.name || imageUrl) {
      await tx.profile.update({
        where: { authId },
        data: {
          ...(payload.name ? { name: payload.name } : {}),
          ...(imageUrl ? { image: imageUrl } : {}),
        },
      });
    }

    const updatedCoach = await tx.coachProfile.update({
      where: { authId },
      data: {
        ...(payload.experience ? { experience: payload.experience } : {}),
        ...(payload.location ? { location: payload.location } : {}),
        ...(payload.teams ? { teams: payload.teams } : {}),
        ...(payload.certificate ? { certificate: payload.certificate } : {}),
        ...(payload.price !== undefined ? { price: payload.price } : {}),
        ...(payload.sessionTypes ? { sessionTypes: payload.sessionTypes } : {}),
        ...(payload.mode ? { mode: payload.mode } : {}),
      },
      include: {
        auth: {
          select: {
            profile: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });

    return updatedCoach;
  });

  if (imageUrl && coachProfile.auth?.profile?.image) {
    await deleteFromS3(coachProfile.auth.profile.image);
  }

  return result;
};

const addAvailability = async (
  coachAuthId: string,
  payload: TCreateCoachAvailability
) => {
  const coachProfile = await prisma.coachProfile.findUnique({
    where: { authId: coachAuthId },
    select: { id: true },
  });
  if (!coachProfile) throw new ApiError(404, "Coach profile not found");

  const startTime = parseTime(payload.startTime);
  const endTime = parseTime(payload.endTime);
  const startAt = parseDate(payload.startAt);
  const endAt = parseDate(payload.endAt);
  const validFrom = parseDate(payload.validFrom);
  const validUntil = parseDate(payload.validUntil);

  if (payload.isRecurring) {
    console.log("payload, ", payload.dayOfWeek, startTime, endTime);
    if (!payload.dayOfWeek || !startTime || !endTime) {
      throw new ApiError(400, "Invalid recurring availability block");
    }
    if (startTime >= endTime) {
      throw new ApiError(400, "endTime must be after startTime");
    }
  } else {
    if (!startAt || !endAt) {
      throw new ApiError(400, "Invalid one-time availability block");
    }
    if (startAt >= endAt) {
      throw new ApiError(400, "endAt must be after startAt");
    }
  }

  if (validFrom && validUntil && validFrom > validUntil) {
    throw new ApiError(400, "validUntil must be after validFrom");
  }

  const overlapsRange = (
    aFrom?: Date | null,
    aUntil?: Date | null,
    bFrom?: Date | null,
    bUntil?: Date | null
  ) => {
    const aStart = aFrom ?? new Date("1900-01-01T00:00:00.000Z");
    const aEnd = aUntil ?? new Date("2999-12-31T00:00:00.000Z");
    const bStart = bFrom ?? new Date("1900-01-01T00:00:00.000Z");
    const bEnd = bUntil ?? new Date("2999-12-31T00:00:00.000Z");
    return aStart <= bEnd && bStart <= aEnd;
  };

  if (payload.isRecurring) {
    const existingRecurring = await prisma.coachAvailabilityBlock.findMany({
      where: {
        coachAuthId,
        type: payload.type,
        isRecurring: true,
        dayOfWeek: payload.dayOfWeek,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        validFrom: true,
        validUntil: true,
      },
    });

    const hasOverlap = existingRecurring.some(block => {
      if (!block.startTime || !block.endTime || !startTime || !endTime)
        return false;
      const timeOverlap =
        startTime < block.endTime && endTime > block.startTime;
      const dateOverlap = overlapsRange(
        validFrom,
        validUntil,
        block.validFrom,
        block.validUntil
      );
      return timeOverlap && dateOverlap;
    });

    if (hasOverlap) {
      throw new ApiError(409, "Availability block overlaps with existing one");
    }
  } else {
    const existingOneTime = await prisma.coachAvailabilityBlock.findMany({
      where: {
        coachAuthId,
        type: payload.type,
        isRecurring: false,
      },
      select: { id: true, startAt: true, endAt: true },
    });

    const hasOverlap = existingOneTime.some(block => {
      if (!block.startAt || !block.endAt || !startAt || !endAt) return false;
      return startAt < block.endAt && endAt > block.startAt;
    });

    if (hasOverlap) {
      throw new ApiError(409, "Availability block overlaps with existing one");
    }
  }

  const duplicateWhere = payload.isRecurring
    ? {
        coachAuthId,
        type: payload.type,
        isRecurring: true,
        dayOfWeek: payload.dayOfWeek,
        startTime,
        endTime,
        validFrom,
        validUntil,
      }
    : {
        coachAuthId,
        type: payload.type,
        isRecurring: false,
        startAt,
        endAt,
      };

  const existing = await prisma.coachAvailabilityBlock.findFirst({
    where: duplicateWhere,
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(409, "Availability block already exists");
  }

  const block = await prisma.coachAvailabilityBlock.create({
    data: {
      coachAuthId,
      type: payload.type,
      isRecurring: payload.isRecurring,
      dayOfWeek: payload.dayOfWeek,
      startTime,
      endTime,
      startAt,
      endAt,
      validFrom,
      validUntil,
    },
  });

  return block;
};

const removeAvailability = async (
  coachAuthId: string,
  availabilityId: string
) => {
  const existing = await prisma.coachAvailabilityBlock.findUnique({
    where: { id: availabilityId },
  });
  if (!existing) throw new ApiError(404, "Availability block not found");
  if (existing.coachAuthId !== coachAuthId)
    throw new ApiError(403, "Unauthorized");

  return prisma.coachAvailabilityBlock.delete({
    where: { id: availabilityId },
  });
};

const getAvailabilityCalendar = async (coachAuthId: string, month: string) => {
  const monthStart = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(monthStart.getTime())) {
    throw new ApiError(400, "Invalid month format (YYYY-MM)");
  }
  const monthEnd = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1)
  );

  const [availabilityBlocks, blackoutBlocks, bookings, customSessions] =
    await Promise.all([
      prisma.coachAvailabilityBlock.findMany({
        where: { coachAuthId, type: "AVAILABLE" },
      }),
      prisma.coachAvailabilityBlock.findMany({
        where: { coachAuthId, type: "BLACKOUT" },
      }),
      prisma.sessionBooking.findMany({
        where: {
          coachAuthId,
          OR: [
            { status: { in: ["PENDING", "APPROVED", "UPCOMING"] } },
            {
              status: "PENDING_PAYMENT",
              reservedUntil: { gt: new Date() },
            },
          ],
          startAt: { lt: monthEnd },
          endAt: { gt: monthStart },
        },
        select: { startAt: true, endAt: true },
      }),
      prisma.customSessionBooking.findMany({
        where: {
          coachAuthId,
          status: { in: ["PENDING", "APPROVED", "UPCOMING"] },
          startAt: { lt: monthEnd },
          endAt: { gt: monthStart },
        },
        select: { startAt: true, endAt: true },
      }),
    ]);
  const bookedRanges = bookings.concat(customSessions);

  const days: Array<{
    date: string;
    hasAvailableSlots: boolean;
    hasBookedSlots: boolean;
    isBlackout: boolean;
  }> = [];

  for (
    let d = new Date(monthStart);
    d < monthEnd;
    d = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)
    )
  ) {
    const dayKey = d.toISOString().slice(0, 10);

    const blackoutExists = blackoutBlocks.some(block => {
      if (block.isRecurring) {
        if (block.dayOfWeek !== getDayOfWeek(d)) return false;
        if (!isWithinValidRange(d, block.validFrom, block.validUntil))
          return false;
        return true;
      }
      if (!block.startAt || !block.endAt) return false;
      return (
        block.startAt <
          new Date(
            Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)
          ) && block.endAt > d
      );
    });

    const availableSlots = availabilityBlocks
      .map(block => {
        if (block.isRecurring) {
          if (block.dayOfWeek !== getDayOfWeek(d)) return null;
          if (!isWithinValidRange(d, block.validFrom, block.validUntil))
            return null;
          if (!block.startTime || !block.endTime) return null;
          return {
            startAt: combineDateAndTime(d, block.startTime),
            endAt: combineDateAndTime(d, block.endTime),
          };
        }
        if (!block.startAt || !block.endAt) return null;
        if (!isSameUTCDate(block.startAt, d)) return null;
        return { startAt: block.startAt, endAt: block.endAt };
      })
      .filter(Boolean) as Array<{ startAt: Date; endAt: Date }>;

    const slotsAfterBlackout = blackoutBlocks.length
      ? availableSlots.filter(slot => {
          return !blackoutBlocks.some(block => {
            if (block.isRecurring) {
              if (block.dayOfWeek !== getDayOfWeek(d)) return false;
              if (!isWithinValidRange(d, block.validFrom, block.validUntil))
                return false;
              if (!block.startTime || !block.endTime) return false;
              const bStart = combineDateAndTime(d, block.startTime);
              const bEnd = combineDateAndTime(d, block.endTime);
              return slot.startAt < bEnd && slot.endAt > bStart;
            }
            if (!block.startAt || !block.endAt) return false;
            return slot.startAt < block.endAt && slot.endAt > block.startAt;
          });
        })
      : availableSlots;

    const hasAvailableSlots = slotsAfterBlackout.length > 0;
    const hasBookedSlots = slotsAfterBlackout.some(slot =>
      bookedRanges.some(b => slot.startAt < b.endAt && slot.endAt > b.startAt)
    );

    days.push({
      date: dayKey,
      hasAvailableSlots,
      hasBookedSlots,
      isBlackout: !hasAvailableSlots && blackoutExists,
    });
  }

  return { month, days };
};

const getAvailabilitySlots = async (coachAuthId: string, date: string) => {
  const day = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(day.getTime())) {
    throw new ApiError(400, "Invalid date format (YYYY-MM-DD)");
  }
  const nextDay = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + 1)
  );

  const [availabilityBlocks, blackoutBlocks, bookings, customSessions] =
    await Promise.all([
      prisma.coachAvailabilityBlock.findMany({
        where: { coachAuthId, type: "AVAILABLE" },
      }),
      prisma.coachAvailabilityBlock.findMany({
        where: { coachAuthId, type: "BLACKOUT" },
      }),
      prisma.sessionBooking.findMany({
        where: {
          coachAuthId,
          OR: [
            { status: { in: ["PENDING", "APPROVED", "UPCOMING"] } },
            {
              status: "PENDING_PAYMENT",
              reservedUntil: { gt: new Date() },
            },
          ],
          startAt: { lt: nextDay },
          endAt: { gt: day },
        },
        select: { startAt: true, endAt: true },
      }),
      prisma.customSessionBooking.findMany({
        where: {
          coachAuthId,
          status: { in: ["PENDING", "APPROVED", "UPCOMING"] },
          startAt: { lt: nextDay },
          endAt: { gt: day },
        },
        select: { startAt: true, endAt: true },
      }),
    ]);
  const bookedRanges = bookings.concat(customSessions);

  const slots = availabilityBlocks
    .map(block => {
      if (block.isRecurring) {
        if (block.dayOfWeek !== getDayOfWeek(day)) return null;
        if (!isWithinValidRange(day, block.validFrom, block.validUntil))
          return null;
        if (!block.startTime || !block.endTime) return null;
        return {
          availabilityBlockId: block.id,
          startAt: combineDateAndTime(day, block.startTime),
          endAt: combineDateAndTime(day, block.endTime),
        };
      }
      if (!block.startAt || !block.endAt) return null;
      if (!isSameUTCDate(block.startAt, day)) return null;
      return {
        availabilityBlockId: block.id,
        startAt: block.startAt,
        endAt: block.endAt,
      };
    })
    .filter(Boolean) as Array<{
    availabilityBlockId: string;
    startAt: Date;
    endAt: Date;
  }>;

  const filtered = slots.filter(slot => {
    return !blackoutBlocks.some(block => {
      if (block.isRecurring) {
        if (block.dayOfWeek !== getDayOfWeek(day)) return false;
        if (!isWithinValidRange(day, block.validFrom, block.validUntil))
          return false;
        if (!block.startTime || !block.endTime) return false;
        const bStart = combineDateAndTime(day, block.startTime);
        const bEnd = combineDateAndTime(day, block.endTime);
        return slot.startAt < bEnd && slot.endAt > bStart;
      }
      if (!block.startAt || !block.endAt) return false;
      return slot.startAt < block.endAt && slot.endAt > block.startAt;
    });
  });

  const results = filtered.map(slot => ({
    ...slot,
    isBooked: bookedRanges.some(
      b => slot.startAt < b.endAt && slot.endAt > b.startAt
    ),
  }));

  return { date, slots: results };
};

export const coachServices = {
  getAll,
  getSingle,
  getMyProfile,
  updateProfile,
  addAvailability,
  removeAvailability,
  getAvailabilityCalendar,
  getAvailabilitySlots,
};
