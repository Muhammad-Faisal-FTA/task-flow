import { describe, expect, it } from "@jest/globals";
import type { Task } from "@/types";
import { positionTimelineTasks } from "@/utils/positionTimelineTasks";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "task-1",
    title: "Test task",
    listId: "list-1",
    completed: false,
    dueDate: "2026-11-10",
    dueTime: null,
    startTime: null,
    endTime: null,
    priority: "C",
    repeat: "none",
    repeatDays: [],
    repeatEndDate: null,
    status: "tomorrow",
    hasRepeatIcon: false,
    links: [],
    ...overrides,
  };
}

describe("positionTimelineTasks", () => {
  it("positions tasks with a start time even when dueTime is missing", () => {
    const task = makeTask({ startTime: "10:30", endTime: "11:15" });

    expect(positionTimelineTasks([task])).toEqual([
      expect.objectContaining({
        task,
        start: 630,
        end: 675,
        lane: 0,
        laneCount: 1,
      }),
    ]);
  });

  it("leaves date-only tasks for the all-day timeline section", () => {
    expect(positionTimelineTasks([makeTask({})])).toEqual([]);
  });
});
