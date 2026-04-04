import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { getAge } from "../../utils/common.utils";
import {
  getDayOfWeek,
  isWithinValidRange,
  combineDateAndTime,
  parseUTCDateOnly,
  toMinutes,
} from "../../utils/booking.utils";
import { TCreateSessionBooking } from "./sessionBooking.validation";
import {
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
} from "../../utils/stripe";

const checkSlotAvailability = async (
  coachAuthId: string,
  startAt: Date,
  endAt: Date
) => {
  const now = new Date();
  await prisma.sessionBooking.updateMany({
    where: {
      status: "PENDING_PAYMENT",
      reservedUntil: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  const [availabilityBlocks, blackoutBlocks] = await Promise.all([
    prisma.coachAvailabilityBlock.findMany({
      where: { coachAuthId, type: "AVAILABLE" },
    }),
    prisma.coachAvailabilityBlock.findMany({
      where: { coachAuthId, type: "BLACKOUT" },
    }),
  ]);

  const requestDay = getDayOfWeek(startAt);
  const requestStartMin = toMinutes(startAt);
  const requestEndMin = toMinutes(endAt);

  const overlapsTime = (blockStart: Date, blockEnd: Date) =>
    requestStartMin < toMinutes(blockEnd) &&
    requestEndMin > toMinutes(blockStart);

  const overlapsDateTime = (blockStart: Date, blockEnd: Date) =>
    startAt < blockEnd && endAt > blockStart;

  const hasBlackout = blackoutBlocks.some(block => {
    if (block.isRecurring) {
      if (block.dayOfWeek !== requestDay) return false;
      if (!isWithinValidRange(startAt, block.validFrom, block.validUntil))
        return false;
      if (!block.startTime || !block.endTime) return false;
      return overlapsTime(block.startTime, block.endTime);
    }
    if (!block.startAt || !block.endAt) return false;
    return overlapsDateTime(block.startAt, block.endAt);
  });

  if (hasBlackout) {
    throw new ApiError(409, "Selected slot is not available");
  }

  const hasAvailability = availabilityBlocks.some(block => {
    if (block.isRecurring) {
      if (block.dayOfWeek !== requestDay) return false;
      if (!isWithinValidRange(startAt, block.validFrom, block.validUntil))
        return false;
      if (!block.startTime || !block.endTime) return false;
      return (
        requestStartMin >= toMinutes(block.startTime) &&
        requestEndMin <= toMinutes(block.endTime)
      );
    }
    if (!block.startAt || !block.endAt) return false;
    return startAt >= block.startAt && endAt <= block.endAt;
  });

  if (!hasAvailability) {
    throw new ApiError(409, "Selected slot is not available");
  }

  const conflict = await prisma.sessionBooking.findFirst({
    where: {
      coachAuthId,
      OR: [
        { status: { in: ["PENDING", "APPROVED", "UPCOMING"] } },
        {
          status: "PENDING_PAYMENT",
          reservedUntil: { gt: now },
        },
      ],
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });

  if (conflict) {
    throw new ApiError(409, "Selected slot is not available");
  }

  const customConflict = await prisma.customSessionBooking.findFirst({
    where: {
      coachAuthId,
      status: {
        in: ["PENDING", "APPROVED", "UPCOMING"],
      },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });

  if (customConflict) {
    throw new ApiError(409, "Selected slot is not available");
  }
};

const checkPlayerDoubleBooking = async (
  playerAuthId: string,
  startAt: Date,
  endAt: Date
) => {
  const now = new Date();
  await prisma.sessionBooking.updateMany({
    where: {
      status: "PENDING_PAYMENT",
      reservedUntil: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  const conflict = await prisma.sessionBooking.findFirst({
    where: {
      playerAuthId,
      OR: [
        { status: { in: ["PENDING", "APPROVED", "UPCOMING"] } },
        {
          status: "PENDING_PAYMENT",
          reservedUntil: { gt: now },
        },
      ],
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });

  if (conflict) {
    throw new ApiError(409, "You already have a booking in this time slot");
  }

  const customConflict = await prisma.customSessionBooking.findFirst({
    where: {
      playerAuthIds: { has: playerAuthId },
      status: {
        in: ["PENDING", "APPROVED", "UPCOMING"],
      },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });

  if (customConflict) {
    throw new ApiError(409, "You already have a booking in this time slot");
  }
};

const create = async (playerAuthId: string, payload: TCreateSessionBooking) => {
  const block = await prisma.coachAvailabilityBlock.findUnique({
    where: { id: payload.availabilityBlockId },
  });
  if (!block) throw new ApiError(404, "Availability block not found");
  if (block.type !== "AVAILABLE")
    throw new ApiError(400, "Selected slot is not available");

  let startAt: Date;
  let endAt: Date;

  if (block.isRecurring) {
    if (!payload.date)
      throw new ApiError(400, "Date is required for recurring slots");
    if (!block.startTime || !block.endTime)
      throw new ApiError(400, "Invalid availability block");

    const date = parseUTCDateOnly(payload.date);
    if (!date) throw new ApiError(400, "Invalid date format (YYYY-MM-DD)");
    const day = getDayOfWeek(date);
    if (block.dayOfWeek !== day)
      throw new ApiError(400, "Date does not match slot day");
    if (!isWithinValidRange(date, block.validFrom, block.validUntil))
      throw new ApiError(400, "Date is outside of slot validity");

    startAt = combineDateAndTime(date, block.startTime);
    endAt = combineDateAndTime(date, block.endTime);
  } else {
    if (!block.startAt || !block.endAt)
      throw new ApiError(400, "Invalid availability block");
    startAt = block.startAt;
    endAt = block.endAt;
  }

  await checkSlotAvailability(block.coachAuthId, startAt, endAt);
  await checkPlayerDoubleBooking(playerAuthId, startAt, endAt);

  const coachProfile = await prisma.coachProfile.findUnique({
    where: { authId: block.coachAuthId },
    select: { mode: true, sessionTypes: true, price: true },
  });
  if (!coachProfile) throw new ApiError(404, "Coach profile not found");

  const sessionType = coachProfile.sessionTypes[0];
  if (!sessionType)
    throw new ApiError(400, "Coach session type is not configured");

  const playerProfile = await prisma.playerProfile.findUnique({
    where: { authId: playerAuthId },
    select: { dob: true },
  });

  const isMinor = playerProfile?.dob ? getAge(playerProfile.dob) < 18 : false;

  const durationHours =
    (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60);
  const totalAmount = coachProfile.price * durationHours;
  const reserveMinutes = 15;
  const reservedUntil = new Date(Date.now() + reserveMinutes * 60 * 1000);

  const booking = await prisma.sessionBooking.create({
    data: {
      coachAuthId: block.coachAuthId,
      playerAuthId,
      sessionType,
      sessionMode: coachProfile.mode,
      startAt,
      endAt,
      status: "PENDING_PAYMENT",
      reservedUntil,
    },
  });

  if (isMinor) {
    const approvalRequest = await prisma.bookingApprovalRequest.create({
      data: {
        playerAuthId,
        bookingId: booking.id,
        status: "PENDING",
      },
    });

    return {
      requiresApproval: true,
      booking,
      approvalRequest,
    };
  }

  const currency = "usd";
  const intent = await createStripePaymentIntent(
    Math.round(totalAmount * 100),
    currency,
    {
      bookingId: booking.id,
      payerAuthId: playerAuthId,
    }
  );

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      payerAuthId: playerAuthId,
      amount: totalAmount,
      currency,
      provider: "stripe",
      providerIntentId: intent.id,
      status: "PENDING",
      expiresAt: reservedUntil,
    },
  });

  return {
    requiresApproval: false,
    booking,
    payment: {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      amount: totalAmount,
      currency,
      reservedUntil,
    },
  };
};

const confirmPayment = async (bookingId: string, payerAuthId: string) => {
  const booking = await prisma.sessionBooking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.status !== "PENDING_PAYMENT") {
    throw new ApiError(400, "Booking is not awaiting payment");
  }

  if (booking.reservedUntil && booking.reservedUntil < new Date()) {
    await prisma.sessionBooking.update({
      where: { id: bookingId },
      data: { status: "EXPIRED" },
    });
    throw new ApiError(400, "Reservation expired");
  }

  const payment = await prisma.payment.findUnique({
    where: { bookingId },
  });
  if (!payment?.providerIntentId) {
    throw new ApiError(404, "Payment intent not found");
  }
  if (payment.payerAuthId !== payerAuthId) {
    throw new ApiError(403, "Unauthorized");
  }

  const intent = await retrieveStripePaymentIntent(payment.providerIntentId);
  if (intent.status !== "succeeded") {
    throw new ApiError(400, "Payment not completed");
  }

  await prisma.$transaction(async tx => {
    await tx.payment.update({
      where: { bookingId },
      data: { status: "SUCCEEDED" },
    });
    await tx.sessionBooking.update({
      where: { id: bookingId },
      data: { status: "APPROVED", reservedUntil: null },
    });
  });

  return { status: "APPROVED" };
};

const getAll = async (
  authId: string,
  role: string,
  options: TPaginationOptions
) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const where =
    role === "COACH" ? { coachAuthId: authId } : { playerAuthId: authId };

  const bookings = await prisma.sessionBooking.findMany({
    where,
    include: {
      coach: {
        select: { id: true, profile: { select: { name: true, image: true } } },
      },
      player: {
        select: { id: true, profile: { select: { name: true, image: true } } },
      },
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.sessionBooking.count({ where });

  return {
    meta: { page, limit: take, total },
    bookings,
  };
};

const getRecent = async (authId: string, role: string) => {
  const where =
    role === "COACH" ? { coachAuthId: authId } : { playerAuthId: authId };

  return prisma.sessionBooking.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      coach: {
        select: { id: true, profile: { select: { name: true, image: true } } },
      },
      player: {
        select: { id: true, profile: { select: { name: true, image: true } } },
      },
    },
  });
};

export const sessionBookingServices = {
  create,
  getAll,
  getRecent,
  confirmPayment,
};
