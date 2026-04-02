export const toMinutes = (date: Date) =>
  date.getUTCHours() * 60 + date.getUTCMinutes();

export const getDayOfWeek = (date: Date) => `D${date.getUTCDay()}`;

export const isWithinValidRange = (
  date: Date,
  validFrom?: Date | null,
  validUntil?: Date | null
) => {
  if (!validFrom && !validUntil) return true;
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  if (validFrom) {
    const from = new Date(
      Date.UTC(
        validFrom.getUTCFullYear(),
        validFrom.getUTCMonth(),
        validFrom.getUTCDate()
      )
    );
    if (day < from) return false;
  }
  if (validUntil) {
    const until = new Date(
      Date.UTC(
        validUntil.getUTCFullYear(),
        validUntil.getUTCMonth(),
        validUntil.getUTCDate()
      )
    );
    if (day > until) return false;
  }
  return true;
};

export const combineDateAndTime = (date: Date, time: Date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      time.getUTCHours(),
      time.getUTCMinutes(),
      time.getUTCSeconds(),
      time.getUTCMilliseconds()
    )
  );

export const isSameUTCDate = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

export const parseUTCDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  return Number.isNaN(date.getTime()) ? undefined : date;
};
