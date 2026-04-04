import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { createStripePaymentIntent } from "../../utils/stripe";
import { TUpdateBookingApprovalStatus } from "./bookingApprovalRequest.validation";

const getAll = async (parentAuthId: string, options: TPaginationOptions) => {
  const children = await prisma.child.findMany({
    where: { parentAuthIds: { has: parentAuthId } },
    select: { playerAuthId: true },
  });

  const playerIds = children.map(c => c.playerAuthId);
  if (playerIds.length === 0) {
    return {
      meta: { page: 1, limit: options.limit ?? 10, total: 0 },
      requests: [],
    };
  }

  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const requests = await prisma.bookingApprovalRequest.findMany({
    where: { playerAuthId: { in: playerIds } },
    include: {
      booking: true,
      player: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, image: true } },
        },
      },
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { requestedAt: "desc" },
  });

  const total = await prisma.bookingApprovalRequest.count({
    where: { playerAuthId: { in: playerIds } },
  });

  return {
    meta: { page, limit: take, total },
    requests,
  };
};

const updateStatus = async (
  parentAuthId: string,
  requestId: string,
  payload: TUpdateBookingApprovalStatus
) => {
  const request = await prisma.bookingApprovalRequest.findUnique({
    where: { id: requestId },
    include: { booking: true },
  });
  if (!request)
    throw new ApiError(404, "Booking approval request not found");

  const isParent = await prisma.child.findFirst({
    where: {
      playerAuthId: request.playerAuthId,
      parentAuthIds: { has: parentAuthId },
    },
    select: { id: true },
  });
  if (!isParent) throw new ApiError(403, "Unauthorized");

  const reserveMinutes = 15;
  const reservedUntil = new Date(Date.now() + reserveMinutes * 60 * 1000);

  return prisma.$transaction(async tx => {
    let intent:
      | { id: string; client_secret: string | null }
      | null = null;
    let finalAmount = 0;
    if (payload.status === "APPROVED") {
      if (request.booking.status !== "PENDING_PAYMENT") {
        throw new ApiError(400, "Booking is not awaiting payment");
      }

      if (request.booking.reservedUntil && request.booking.reservedUntil < new Date()) {
        await tx.sessionBooking.update({
          where: { id: request.bookingId },
          data: { status: "EXPIRED" },
        });
        throw new ApiError(400, "Reservation expired");
      }

      const amount = await tx.payment.findUnique({
        where: { bookingId: request.bookingId },
        select: { amount: true },
      });

      const totalAmount =
        amount?.amount ??
        (await tx.coachProfile.findUnique({
          where: { authId: request.booking.coachAuthId },
          select: { price: true },
        }))?.price ??
        0;

      const durationHours =
        (request.booking.endAt.getTime() - request.booking.startAt.getTime()) /
        (1000 * 60 * 60);
      finalAmount = amount?.amount ?? totalAmount * durationHours;

      intent = await createStripePaymentIntent(
        Math.round(finalAmount * 100),
        "usd",
        {
          bookingId: request.bookingId,
          payerAuthId: parentAuthId,
        }
      );

      await tx.payment.upsert({
        where: { bookingId: request.bookingId },
        update: {
          payerAuthId: parentAuthId,
          amount: finalAmount,
          currency: "usd",
          provider: "stripe",
          providerIntentId: intent.id,
          status: "PENDING",
          expiresAt: reservedUntil,
        },
        create: {
          bookingId: request.bookingId,
          payerAuthId: parentAuthId,
          amount: finalAmount,
          currency: "usd",
          provider: "stripe",
          providerIntentId: intent.id,
          status: "PENDING",
          expiresAt: reservedUntil,
        },
      });

      await tx.sessionBooking.update({
        where: { id: request.bookingId },
        data: { reservedUntil },
      });
    } else if (payload.status === "REJECTED") {
      await tx.sessionBooking.delete({
        where: { id: request.bookingId },
      });
    }

    await tx.bookingApprovalRequest.delete({
      where: { id: requestId },
    });

    if (payload.status === "APPROVED") {
      return {
        status: payload.status,
        paymentRequired: true,
        payment: {
          paymentIntentId: intent?.id,
          clientSecret: intent?.client_secret,
          amount: finalAmount,
          currency: "usd",
          reservedUntil,
        },
      };
    }

    return { status: payload.status };
  });
};

export const bookingApprovalRequestServices = {
  getAll,
  updateStatus,
};
