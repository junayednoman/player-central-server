import ApiError from "../classes/ApiError";
import { parseDate, parseTime } from "./common.utils";

type TAvailabilityBlockInput = {
  type: "AVAILABLE" | "BLACKOUT";
  isRecurring: boolean;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  startAt?: string;
  endAt?: string;
  validFrom?: string;
  validUntil?: string;
};

type TNormalizedAvailabilityBlock = {
  index: number;
  type: "AVAILABLE" | "BLACKOUT";
  isRecurring: boolean;
  dayOfWeek?: string;
  startTime?: Date;
  endTime?: Date;
  startAt?: Date;
  endAt?: Date;
  validFrom?: Date;
  validUntil?: Date;
};

const overlapsRange = (
  aFrom?: Date,
  aUntil?: Date,
  bFrom?: Date,
  bUntil?: Date
) => {
  const aStart = aFrom ?? new Date("1900-01-01T00:00:00.000Z");
  const aEnd = aUntil ?? new Date("2999-12-31T00:00:00.000Z");
  const bStart = bFrom ?? new Date("1900-01-01T00:00:00.000Z");
  const bEnd = bUntil ?? new Date("2999-12-31T00:00:00.000Z");
  return aStart <= bEnd && bStart <= aEnd;
};

const normalizeAvailabilityBlock = (
  block: TAvailabilityBlockInput,
  index: number
): TNormalizedAvailabilityBlock => {
  const normalized: TNormalizedAvailabilityBlock = {
    index,
    type: block.type,
    isRecurring: block.isRecurring,
    dayOfWeek: block.dayOfWeek,
    startTime: parseTime(block.startTime),
    endTime: parseTime(block.endTime),
    startAt: parseDate(block.startAt),
    endAt: parseDate(block.endAt),
    validFrom: parseDate(block.validFrom),
    validUntil: parseDate(block.validUntil),
  };

  if (normalized.isRecurring) {
    if (
      !normalized.dayOfWeek ||
      !normalized.startTime ||
      !normalized.endTime
    ) {
      throw new ApiError(
        400,
        `Invalid recurring availability block at index ${index}`
      );
    }

    if (normalized.startTime >= normalized.endTime) {
      throw new ApiError(
        400,
        `Recurring availability block at index ${index} must end after it starts`
      );
    }
  } else {
    if (!normalized.startAt || !normalized.endAt) {
      throw new ApiError(
        400,
        `Invalid one-time availability block at index ${index}`
      );
    }

    if (normalized.startAt >= normalized.endAt) {
      throw new ApiError(
        400,
        `One-time availability block at index ${index} must end after it starts`
      );
    }
  }

  if (
    normalized.validFrom &&
    normalized.validUntil &&
    normalized.validFrom > normalized.validUntil
  ) {
    throw new ApiError(
      400,
      `Availability block at index ${index} has an invalid validity range`
    );
  }

  return normalized;
};

export const assertNoOverlappingAvailabilityBlocks = (
  blocks: TAvailabilityBlockInput[]
) => {
  const normalizedBlocks = blocks.map(normalizeAvailabilityBlock);

  for (let i = 0; i < normalizedBlocks.length; i += 1) {
    for (let j = i + 1; j < normalizedBlocks.length; j += 1) {
      const a = normalizedBlocks[i]!;
      const b = normalizedBlocks[j]!;

      if (a.type !== b.type) continue;
      if (a.isRecurring !== b.isRecurring) continue;

      if (a.isRecurring && b.isRecurring) {
        if (a.dayOfWeek !== b.dayOfWeek) continue;
        if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) continue;

        const timeOverlap =
          a.startTime < b.endTime && a.endTime > b.startTime;
        const dateOverlap = overlapsRange(
          a.validFrom,
          a.validUntil,
          b.validFrom,
          b.validUntil
        );

        if (timeOverlap && dateOverlap) {
          throw new ApiError(
            409,
            `Availability blocks at indexes ${a.index} and ${b.index} overlap`
          );
        }
      }

      if (!a.isRecurring && !b.isRecurring) {
        if (!a.startAt || !a.endAt || !b.startAt || !b.endAt) continue;

        if (a.startAt < b.endAt && a.endAt > b.startAt) {
          throw new ApiError(
            409,
            `Availability blocks at indexes ${a.index} and ${b.index} overlap`
          );
        }
      }
    }
  }
};
