import { createPendingAction, getPendingActionSummary } from "@/lib/offlineActions";

describe("offline action helpers", () => {
  it("creates a pending action with default metadata", () => {
    const action = createPendingAction("create-task", { title: "Test task" }, "task-1");

    expect(action.type).toBe("create-task");
    expect(action.entityId).toBe("task-1");
    expect(action.status).toBe("pending");
    expect(action.attempts).toBe(0);
    expect(action.payload).toEqual({ title: "Test task" });
    expect(action.id).toContain("create-task");
  });

  it("summarizes pending actions by type", () => {
    const actions = [
      createPendingAction("create-task", { title: "A" }, "task-1"),
      createPendingAction("update-task", { title: "B" }, "task-2"),
      createPendingAction("create-task", { title: "C" }, "task-3"),
    ];

    const summary = getPendingActionSummary(actions);

    expect(summary.pending).toBe(3);
    expect(summary.byType["create-task"]).toBe(2);
    expect(summary.byType["update-task"]).toBe(1);
  });
});
