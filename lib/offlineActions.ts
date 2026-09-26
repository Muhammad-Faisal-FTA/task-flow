export type PendingActionStatus = "pending" | "syncing" | "failed" | "done";

export interface PendingAction {
  id: string;
  type: string;
  entityId?: string;
  payload: Record<string, unknown>;
  status: PendingActionStatus;
  attempts: number;
  createdAt: number;
  updatedAt: number;
}

export function createPendingAction(
  type: string,
  payload: Record<string, unknown>,
  entityId?: string,
): PendingAction {
  const now = Date.now();
  return {
    id: `${type}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    entityId,
    payload,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function getPendingActionSummary(actions: PendingAction[]) {
  return {
    pending: actions.filter((action) => action.status === "pending").length,
    byType: actions.reduce<Record<string, number>>((acc, action) => {
      acc[action.type] = (acc[action.type] ?? 0) + 1;
      return acc;
    }, {}),
  };
}
