// utils/taskGrouping.ts
// Groups a flat array of TaskDTOs into status buckets.
// Used by taskService and API responses for FR-06.

import type { TaskDTO, GroupedTasks, TaskStatus } from "@/types/task";
import { STATUS_ORDER } from "@/utils/deriveStatus";

// ─── Group flat array into buckets ────────────────────────────────────────────
/**
 * Takes a flat TaskDTO[] and returns GroupedTasks.
 * Each bucket is sorted by dueDate ASC, then createdAt ASC.
 *
 * Usage:
 *   const grouped = groupTasksByStatus(tasks);
 *   grouped.overdue  → TaskDTO[]
 *   grouped.today    → TaskDTO[]
 */
export function groupTasksByStatus(tasks: TaskDTO[]): GroupedTasks {
  // Initialise empty buckets in STATUS_ORDER
  const groups: GroupedTasks = {
    overdue:   [],
    today:     [],
    tomorrow:  [],
    next_week: [],
    future:    [],
    nodate:    [],
  };

  // Single pass — O(n)
  for (const task of tasks) {
    groups[task.status].push(task);
  }

  // Sort each bucket
  for (const status of STATUS_ORDER) {
    groups[status] = sortTasks(groups[status], status);
  }

  return groups;
}

// ─── Sort tasks within a bucket ───────────────────────────────────────────────
/**
 * Sort rules per bucket:
 * - overdue   → oldest first (most overdue at top)
 * - today     → by dueTime ASC (earliest time first), null times last
 * - tomorrow  → by dueTime ASC
 * - next_week → by dueDate ASC
 * - future    → by dueDate ASC
 * - nodate    → by createdAt DESC (newest first)
 */
function sortTasks(tasks: TaskDTO[], status: TaskStatus): TaskDTO[] {
  return [...tasks].sort((a, b) => {
    switch (status) {
      case "overdue":
        // Oldest overdue first
        return compareDates(a.dueDate, b.dueDate, "asc");

      case "today":
      case "tomorrow":
        // By time — null times go to bottom
        return compareTime(a.dueTime, b.dueTime);

      case "next_week":
      case "future":
        // By date ascending
        return compareDates(a.dueDate, b.dueDate, "asc");

      case "nodate":
        // Newest created first
        return compareDates(a.createdAt, b.createdAt, "desc");

      default:
        return 0;
    }
  });
}

// ─── Compare helpers ──────────────────────────────────────────────────────────
function compareDates(
  a: string | null,
  b: string | null,
  direction: "asc" | "desc"
): number {
  if (!a && !b) return 0;
  if (!a) return 1;   // nulls always last
  if (!b) return -1;

  const diff = new Date(a).getTime() - new Date(b).getTime();
  return direction === "asc" ? diff : -diff;
}

function compareTime(
  a: string | null,
  b: string | null
): number {
  // Both null — equal
  if (!a && !b) return 0;
  // Null times go to bottom
  if (!a) return 1;
  if (!b) return -1;

  // "HH:MM" → compare as strings (lexicographic works for time)
  return a.localeCompare(b);
}

// ─── Flatten grouped tasks back to array ──────────────────────────────────────
/**
 * Converts GroupedTasks → flat TaskDTO[] in STATUS_ORDER.
 * Useful for search results and list-filtered views.
 */
export function flattenGrouped(grouped: GroupedTasks): TaskDTO[] {
  return STATUS_ORDER.flatMap((status) => grouped[status]);
}

// ─── Count helpers ────────────────────────────────────────────────────────────
/**
 * Total task count across all buckets
 */
export function countTasks(grouped: GroupedTasks): number {
  return STATUS_ORDER.reduce((sum, status) => sum + grouped[status].length, 0);
}

/**
 * Overdue count — used for FR-16 badge
 */
export function countOverdue(tasks: TaskDTO[]): number {
  return tasks.filter((t) => t.status === "overdue").length;
}

/**
 * Count per bucket — used for section headers
 */
export function countPerStatus(grouped: GroupedTasks): Record<TaskStatus, number> {
  return STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = grouped[status].length;
      return acc;
    },
    {} as Record<TaskStatus, number>
  );
}

// ─── Filter helpers ───────────────────────────────────────────────────────────
/**
 * Filter tasks by listId — FR-14
 */
export function filterByList(
  tasks: TaskDTO[],
  listId: string
): TaskDTO[] {
  return tasks.filter((t) => t.listId === listId);
}

/**
 * Search tasks by title — FR-10
 * Case-insensitive, trims whitespace
 */
export function searchTasks(
  tasks: TaskDTO[],
  query: string
): TaskDTO[] {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter((t) =>
    t.title.toLowerCase().includes(q)
  );
}

/**
 * Filter out completed tasks
 */
export function filterActive(tasks: TaskDTO[]): TaskDTO[] {
  return tasks.filter((t) => !t.completed);
}

/**
 * Filter only completed tasks
 */
export function filterCompleted(tasks: TaskDTO[]): TaskDTO[] {
  return tasks.filter((t) => t.completed);
}

/**
 * Filter out soft-deleted tasks — default behaviour
 */
export function filterNotDeleted(tasks: TaskDTO[]): TaskDTO[] {
  return tasks.filter((t) => t.deletedAt === null);
}

/**
 * Filter only soft-deleted tasks — for undo (FR-15)
 */
export function filterDeleted(tasks: TaskDTO[]): TaskDTO[] {
  return tasks.filter((t) => t.deletedAt !== null);
}