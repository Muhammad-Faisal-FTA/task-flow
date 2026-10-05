export const TASK_REMINDER_LEAD_MS = 2 * 60 * 1000;

export function isTaskReminderDue(now: Date, dueAt: Date): boolean {
  const reminderAt = dueAt.getTime() - TASK_REMINDER_LEAD_MS;
  return now.getTime() >= reminderAt && now.getTime() < dueAt.getTime();
}
