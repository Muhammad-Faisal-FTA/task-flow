import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import type { Task } from "@/types";
import { TaskTimeline } from "@/components/task/TaskTimeline";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "task-1",
    title: "Previous day task",
    listId: "list-1",
    completed: false,
    dueDate: "2026-11-08",
    dueTime: null,
    startTime: null,
    endTime: null,
    priority: "C",
    repeat: "none",
    repeatDays: [],
    repeatEndDate: null,
    status: "overdue",
    hasRepeatIcon: false,
    links: [],
    ...overrides,
  };
}

describe("TaskTimeline", () => {
  it("shows tasks for the previous day when navigating backward", () => {
    render(
      <TaskTimeline
        tasks={[
          makeTask({}),
          makeTask({
            id: "today-task",
            title: "Today task",
            dueDate: "2026-11-09",
            status: "today",
          }),
        ]}
        onTaskClick={jest.fn()}
        onToggle={jest.fn(async () => {})}
        isToggling={() => false}
        date="2026-11-09"
        lists={[]}
        selectedListId={null}
        onQuickAdd={jest.fn(async () => true)}
      />,
    );

    expect(screen.queryByText("Previous day task")).not.toBeInTheDocument();
    expect(screen.getByText("Today task")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show previous day" }));

    expect(screen.getByText("Previous day task")).toBeInTheDocument();
    expect(screen.queryByText("Today task")).not.toBeInTheDocument();
  });
});
