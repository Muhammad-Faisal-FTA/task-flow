import { describe, expect, it } from "@jest/globals";
import { isTaskReminderDue, TASK_REMINDER_LEAD_MS } from "@/utils/notificationTiming";

describe("isTaskReminderDue", () => {
  const dueAt = new Date("2026-10-05T15:00:00.000Z");

  it("becomes eligible exactly two minutes before the due time", () => {
    expect(isTaskReminderDue(new Date(dueAt.getTime() - TASK_REMINDER_LEAD_MS - 1), dueAt)).toBe(false);
    expect(isTaskReminderDue(new Date(dueAt.getTime() - TASK_REMINDER_LEAD_MS), dueAt)).toBe(true);
  });

  it("remains eligible until, but not at or after, the due time", () => {
    expect(isTaskReminderDue(new Date(dueAt.getTime() - 1), dueAt)).toBe(true);
    expect(isTaskReminderDue(dueAt, dueAt)).toBe(false);
  });
});
