import { DayPart, Member } from "./types";

export function getDayPartFromEventSummary(summary: string) {
  if (summary.includes(DayPart.MORNING)) {
    return DayPart.MORNING;
  }
  if (summary.includes(DayPart.AFTERNOON)) {
    return DayPart.AFTERNOON;
  }
  return DayPart.FULL;
}

export function getMemberNameFromEventSummary(summary: string) {
  return summary.split(" (off")[0];
}

export function generateTimeText(
  startDate: Date,
  endDate: Date,
  dayPart: DayPart
) {
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
    if (dayPart !== DayPart.FULL) {
      timeText += ` ${dayPart}`;
    }
  } else {
    timeText = `from ${niceStartDate} to ${niceEndDate}`;
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

export function findMemberById({
  members,
  id,
}: {
  members: Member[];
  id: string;
}) {
  return members.find((member) => member.id === id);
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
