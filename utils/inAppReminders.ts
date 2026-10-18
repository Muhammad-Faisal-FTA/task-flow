import type { Task } from "@/types";

export const IN_APP_REMINDER_LEAD_MS = 2 * 60 * 1000;

export function getTaskStartTime(task: Pick<Task, "startTime" | "dueTime">): string | null {
  return task.startTime ?? task.dueTime ?? null;
}

export function getInAppReminderKey(task: Pick<Task, "id" | "dueDate" | "startTime" | "dueTime">): string {
  return `${task.id}:${task.dueDate}:${getTaskStartTime(task)}`;
}

export function isInAppReminderDue(
  task: Pick<Task, "completed" | "dueDate" | "startTime" | "dueTime">,
  now: Date,
): boolean {
  const startTime = getTaskStartTime(task);
  if (task.completed || !task.dueDate || !startTime) return false;

  const startAt = new Date(`${task.dueDate}T${startTime}:00`);
  if (Number.isNaN(startAt.getTime())) return false;

  const reminderAt = startAt.getTime() - IN_APP_REMINDER_LEAD_MS;
  return now.getTime() >= reminderAt && now.getTime() < startAt.getTime();
}
