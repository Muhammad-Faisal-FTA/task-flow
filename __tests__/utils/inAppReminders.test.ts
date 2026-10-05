import { describe, expect, it } from "@jest/globals";
import { getTaskStartTime, IN_APP_REMINDER_LEAD_MS, isInAppReminderDue } from "@/utils/inAppReminders";

describe("isInAppReminderDue", () => {
  it("becomes due two minutes before the task start time and stops at the start time", () => {
    const startAt = new Date(2026, 9, 5, 17, 0);
    const task = {
      completed: false,
      dueDate: "2026-10-05",
      startTime: "17:00",
      dueTime: null,
    };

    expect(isInAppReminderDue(task, new Date(startAt.getTime() - IN_APP_REMINDER_LEAD_MS - 1))).toBe(false);
    expect(isInAppReminderDue(task, new Date(startAt.getTime() - IN_APP_REMINDER_LEAD_MS))).toBe(true);
    expect(isInAppReminderDue(task, new Date(startAt.getTime() - 1))).toBe(true);
    expect(isInAppReminderDue(task, startAt)).toBe(false);
  });

  it("does not remind for completed or unscheduled tasks", () => {
    const now = new Date(2026, 9, 5, 17, 0);

    expect(isInAppReminderDue({ completed: true, dueDate: "2026-10-05", startTime: "17:00", dueTime: null }, now)).toBe(false);
    expect(isInAppReminderDue({ completed: false, dueDate: null, startTime: "17:00", dueTime: null }, now)).toBe(false);
    expect(isInAppReminderDue({ completed: false, dueDate: "2026-10-05", startTime: null, dueTime: null }, now)).toBe(false);
  });

  it("uses the due time as a fallback start time for existing tasks without start times", () => {
    expect(getTaskStartTime({ startTime: null, dueTime: "17:00" })).toBe("17:00");
    expect(isInAppReminderDue(
      { completed: false, dueDate: "2026-10-05", startTime: null, dueTime: "17:00" },
      new Date(2026, 9, 5, 16, 58),
    )).toBe(true);
  });
});
