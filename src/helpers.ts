import type { CalendarEvent, DayPart, User } from "@/types";

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
  const foundUser = users.find((user) => user["Email"] === email);
  console.info(foundUser);
  return foundUser;
}

export function getToday() {
  const today = new Date();
  // Asia/Ho_Chi_Minh
  today.setHours(today.getHours() + 7);
  return today;
}

export function startOfDay(date: Date) {
  const newDate = new Date(date);
  newDate.setHours(7, 0, 0, 0);
  return newDate;
}

export function endOfDay(date: Date) {
  const newDate = new Date(date);
  newDate.setHours(16, 59, 59, 999);
  return newDate;
}

export function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
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
