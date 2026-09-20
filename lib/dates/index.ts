const TIME_ZONE = "America/New_York";

export const NEW_YORK_TIME_ZONE = TIME_ZONE;

function dateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    weekday: value("weekday"),
  };
}

function timeZoneOffset(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const representedAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return representedAsUtc - date.getTime();
}

export function newYorkDateToUtc(
  value: string,
  endOfDay = false,
): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const millisecond = endOfDay ? 999 : 0;
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const firstPass = new Date(guess.getTime() - timeZoneOffset(guess));
  const corrected = new Date(
    guess.getTime() - timeZoneOffset(firstPass) + millisecond,
  );

  const actual = dateParts(corrected);
  if (actual.year !== year || actual.month !== month || actual.day !== day) {
    return null;
  }
  return corrected;
}

export function newYorkLocalDateTimeToUtc(dateValue: string, timeValue = "00:00:00") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}(:\d{2})?$/.test(timeValue)) {
    return null;
  }
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute, second = 0] = timeValue.split(":").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const firstPass = new Date(guess.getTime() - timeZoneOffset(guess));
  return new Date(guess.getTime() - timeZoneOffset(firstPass));
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftCalendarDate(
  year: number,
  month: number,
  day: number,
  amount: number,
) {
  const shifted = new Date(Date.UTC(year, month - 1, day + amount, 12));
  return isoDate(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}

export function newYorkCalendarDate(offsetDays = 0) {
  const now = new Date();
  const current = dateParts(now);
  return shiftCalendarDate(current.year, current.month, current.day, offsetDays);
}

export function eventLocalDate(value: string) {
  const parts = dateParts(new Date(value));
  return isoDate(parts.year, parts.month, parts.day);
}

export function formatNewYorkMonthYear(value = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
    year: "numeric",
  }).format(value).toUpperCase();
}

export function formatEventDay(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: get("weekday").toUpperCase(),
    month: get("month").toUpperCase(),
    day: get("day"),
  };
}

export function resolveDateRange(
  range: "today" | "weekend" | "week" | "month" | "custom",
  customStart?: string,
  customEnd?: string,
) {
  const now = new Date();
  const current = dateParts(now);
  const today = isoDate(current.year, current.month, current.day);
  let startDate = today;
  let endDate = shiftCalendarDate(current.year, current.month, current.day, 30);

  if (range === "today") {
    endDate = today;
  } else if (range === "week") {
    endDate = shiftCalendarDate(current.year, current.month, current.day, 7);
  } else if (range === "weekend") {
    const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      current.weekday,
    );
    const untilFriday = weekdayIndex <= 5 ? 5 - weekdayIndex : 0;
    const untilSunday = weekdayIndex === 0 ? 0 : 7 - weekdayIndex;
    startDate = shiftCalendarDate(
      current.year,
      current.month,
      current.day,
      weekdayIndex === 0 || weekdayIndex >= 5 ? 0 : untilFriday,
    );
    endDate = shiftCalendarDate(
      current.year,
      current.month,
      current.day,
      untilSunday,
    );
  } else if (range === "custom") {
    const parsedStart = customStart && newYorkDateToUtc(customStart);
    const parsedEnd = customEnd && newYorkDateToUtc(customEnd, true);
    if (parsedStart && parsedEnd && parsedEnd >= parsedStart) {
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      startDate = customStart;
      endDate =
        parsedEnd.getTime() - parsedStart.getTime() <= ninetyDays
          ? customEnd
          : shiftCalendarDate(
              Number(customStart.slice(0, 4)),
              Number(customStart.slice(5, 7)),
              Number(customStart.slice(8, 10)),
              90,
            );
    } else {
      range = "month";
    }
  }

  const requestedStart = newYorkDateToUtc(startDate) ?? now;
  const start = requestedStart > now ? requestedStart : now;
  const end = newYorkDateToUtc(endDate, true) ?? new Date(now.getTime() + 30 * 864e5);
  return { start, end, effectiveRange: range, startDate, endDate };
}

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatEventDateLong(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function toTicketmasterDateTime(value: Date) {
  return value.toISOString().replace(/\.\d{3}Z$/, "Z");
}
