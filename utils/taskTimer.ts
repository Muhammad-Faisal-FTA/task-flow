import type { Task } from "@/types";

export function getTaskTimerState(task: Pick<Task, "dueDate" | "startTime" | "dueTime" | "durationMinutes">, now: Date) {
  const startTime = task.startTime ?? task.dueTime;
  if (!task.dueDate || !startTime || !task.durationMinutes) return null;

  const [year, month, day] = task.dueDate.slice(0, 10).split("-").map(Number);
  const [hour, minute] = startTime.split(":").map(Number);
  const startAt = new Date(year, month - 1, day, hour, minute);
  if (Number.isNaN(startAt.getTime())) return null;
  const durationMs = task.durationMinutes * 60_000;
  const elapsedMs = Math.max(0, now.getTime() - startAt.getTime());
  return {
    started: now.getTime() >= startAt.getTime(),
    complete: elapsedMs >= durationMs,
    remainingMs: Math.max(0, durationMs - elapsedMs),
    elapsedMs: Math.min(durationMs, elapsedMs),
    startAt,
  };
}

export function formatTimerDuration(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}
