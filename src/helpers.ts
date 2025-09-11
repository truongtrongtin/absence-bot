import type { CalendarEvent, DayPart, User } from "@/types";
const defaultTimeZone = "Asia/Bangkok";

export function getDayPartFromEventSummary(
  summary: CalendarEvent["summary"],
): DayPart {
  if (summary.includes("morning")) {
    return "morning";
  }
  if (summary.includes("afternoon")) {
    return "afternoon";
  }
  return "full";
}

export function getUserNameFromEventSummary(summary: CalendarEvent["summary"]) {
  return summary.split(" (off")[0];
}

export function generateTimeText({
  startDate,
  endDate,
  dayPart,
}: {
  startDate: Date;
  endDate: Date;
  dayPart: DayPart;
}) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const niceStartDate = formatter.format(startDate);
  const niceEndDate = formatter.format(endDate);
  let timeText = "";

  if (isSameDay(startDate, endDate)) {
    timeText = `on ${niceStartDate}`;
    if (dayPart !== "full") {
      timeText += ` ${dayPart}`;
    }
  } else {
    timeText = `from ${niceStartDate} to ${niceEndDate}`;
  }

  return timeText;
}

export function generateTimeText2({
  startDate,
  endDate,
  dayPart,
}: {
  startDate: Date;
  endDate: Date;
  dayPart: DayPart;
}) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const niceStartDate = formatter.format(startDate);
  const niceEndDate = formatter.format(endDate);
  let timeText = "";

  if (isSameDay(startDate, endDate)) {
    timeText = niceStartDate;
    if (dayPart !== "full") {
      timeText += ` ${dayPart}`;
    }
  } else {
    timeText = `${niceStartDate} - ${niceEndDate}`;
  }

  return timeText;
}

export function isWeekendInRange(startDate: Date, endDate: Date) {
  let isWeekend = false;
  const start = new Date(startDate);
  const end = new Date(endDate);

  while (start <= end) {
    const day = start.getDay();
    isWeekend = day === 6 || day === 0;
    if (isWeekend) {
      return true;
    }
    start.setDate(start.getDate() + 1);
  }
  return false;
}

export function findUserByEmail({
  users,
  email,
}: {
  users: User[];
  email: User["Email"];
}) {
  const sheetUser = users.find((user) => user["Email"] === email);
  console.info("sheetUser", sheetUser);
  return sheetUser;
}

export function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

export function addDays(date: Date, amount: number) {
  const newDate = new Date(date);
  return new Date(newDate.setDate(newDate.getDate() + amount));
}

export function subDays(date: Date, amount: number) {
  return addDays(date, -amount);
}

export function formatDateInTimezone(
  date: Date,
  timeZone: string = defaultTimeZone,
): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  });
  return formatter.format(date);
}

export function getYearInTimezone(
  date: Date,
  timeZone: string = defaultTimeZone,
): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone,
  });
  return Number(formatter.format(date));
}

export function getStartOfYearInTimezone(
  date: Date,
  timeZone: string = defaultTimeZone,
): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone,
  });
  const year = Number(formatter.format(date));
  return new Date(year, 0, 1);
}

export function getEndOfYearInTimezone(
  date: Date,
  timeZone: string = defaultTimeZone,
): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone,
  });
  const year = Number(formatter.format(date));
  return new Date(year, 11, 31, 23, 59, 59, 999);
}

export function getStartOfDayInTimezone(
  date: Date,
  timeZone: string = defaultTimeZone,
): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone,
  });
  const formattedDateString = formatter.format(date);
  return new Date(formattedDateString);
}

export function getEndOfDayInTimezone(
  date: Date,
  timeZone: string = defaultTimeZone,
): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone,
  });
  const formattedDateString = formatter.format(date);
  const endOfDay = new Date(formattedDateString);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

export function get3pmInTimezone(
  date: Date,
  timeZone: string = defaultTimeZone,
): Date {
  const localDateAt3pm = new Date(date);
  localDateAt3pm.setHours(15, 0, 0, 0);
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone,
  });
  const formattedDateString = formatter.format(localDateAt3pm);
  return new Date(formattedDateString);
}
