import type { RepeatFrequency } from "@/types/task";

export function nextRepeatDate(date: Date, repeat: RepeatFrequency): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  if (repeat === "daily") return new Date(Date.UTC(year, month, day + 1));
  if (repeat === "weekdays") {
    const next = new Date(Date.UTC(year, month, day + 1));
    while (next.getUTCDay() === 0 || next.getUTCDay() === 6) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    return next;
  }
  if (repeat === "weekly") return new Date(Date.UTC(year, month, day + 7));
  if (repeat === "monthly") {
    const nextMonth = new Date(Date.UTC(year, month + 1, 1));
    const lastDay = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
    nextMonth.setUTCDate(Math.min(day, lastDay));
    return nextMonth;
  }
  if (repeat === "yearly") {
    const nextYear = new Date(Date.UTC(year + 1, month, 1));
    const lastDay = new Date(Date.UTC(year + 1, month + 1, 0)).getUTCDate();
    nextYear.setUTCDate(Math.min(day, lastDay));
    return nextYear;
  }

  return new Date(date);
}