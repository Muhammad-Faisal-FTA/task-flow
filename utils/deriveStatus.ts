// utils/deriveStatus.ts
// Derives task status from dueDate at READ time — never stored in DB.
// Single source of truth for all status logic across the app.

import type { TaskStatus } from "@/types/task";

// ─── Date boundary helpers ────────────────────────────────────────────────────
// All comparisons use start-of-day to avoid time-of-day inconsistencies.
// e.g. a task due "today" at 11:59 PM is still "today" at 11:58 PM.

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  );
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ─── Core derive function ─────────────────────────────────────────────────────
/**
 * Derives TaskStatus from a dueDate.
 *
 * Rules:
 * - No dueDate                    → "nodate"
 * - completed = true              → always "today" bucket (don't re-derive)
 * - dueDate < today               → "overdue"
 * - dueDate === today             → "today"
 * - dueDate === tomorrow          → "tomorrow"
 * - dueDate within next 7 days    → "next_week"
 * - dueDate > 7 days from now     → "future"
 */
export function deriveStatus(
  dueDate: Date | null,
  completed: boolean,
  deletedAt: Date | null = null
): TaskStatus {
  // Deleted tasks — treat as nodate (shouldn't appear in normal views)
  if (deletedAt !== null) return "nodate";

  // No due date set
  if (!dueDate) return "nodate";

  // Completed tasks don't need status bucketing
  // They are filtered separately in queries
  if (completed) return "today";

  const now      = new Date();
  const todayStart    = startOfDay(now);
  const tomorrowStart = startOfDay(addDays(now, 1));
  const nextWeekEnd   = startOfDay(addDays(now, 7));
  const dueDateStart  = startOfDay(dueDate);

  if (dueDateStart < todayStart)    return "overdue";
  if (dueDateStart.getTime() === todayStart.getTime())    return "today";
  if (dueDateStart.getTime() === tomorrowStart.getTime()) return "tomorrow";
  if (dueDateStart <= nextWeekEnd)  return "next_week";
  return "future";
}

// ─── Batch derive ─────────────────────────────────────────────────────────────
// Useful when serialising an array of tasks from DB
export function deriveStatusBatch(
  tasks: Array<{
    dueDate: Date | null;
    completed: boolean;
    deletedAt: Date | null;
  }>
): TaskStatus[] {
  return tasks.map((t) => deriveStatus(t.dueDate, t.completed, t.deletedAt));
}

// ─── Status display metadata ──────────────────────────────────────────────────
// Used in UI components — single source of truth for labels + colors
export interface StatusMeta {
  label: string;
  color: string;        // CSS variable name
  dotColor: string;     // hex — for direct style use
}

export const STATUS_META: Record<TaskStatus, StatusMeta> = {
  overdue: {
    label:    "Overdue",
    color:    "var(--color-overdue)",
    dotColor: "#E53935",
  },
  today: {
    label:    "Today",
    color:    "var(--color-today)",
    dotColor: "#29B6F6",
  },
  tomorrow: {
    label:    "Tomorrow",
    color:    "var(--color-accent)",
    dotColor: "#29B6F6",
  },
  next_week: {
    label:    "Next Week",
    color:    "var(--color-primary)",
    dotColor: "#1E8BC3",
  },
  future: {
    label:    "Future",
    color:    "var(--color-text-secondary)",
    dotColor: "#B0C4DE",
  },
  nodate: {
    label:    "No Date",
    color:    "var(--color-text-hint)",
    dotColor: "#6B8CAE",
  },
};

// ─── Status order ─────────────────────────────────────────────────────────────
// Used in taskGrouping.ts to sort sections consistently
export const STATUS_ORDER: TaskStatus[] = [
  "overdue",
  "today",
  "tomorrow",
  "next_week",
  "future",
  "nodate",
];

// ─── Is task urgent ───────────────────────────────────────────────────────────
// Utility used for notification logic (FR-11)
export function isUrgent(status: TaskStatus): boolean {
  return status === "overdue" || status === "today";
}

// ─── Due date string → Date ───────────────────────────────────────────────────
// Safely parses "YYYY-MM-DD" string from API input to Date
// Returns null if invalid
export function parseDueDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Date → "YYYY-MM-DD" string ──────────────────────────────────────────────
// Serialises Date to string for API responses
export function formatDueDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split("T")[0];
}

// ─── Time validation ──────────────────────────────────────────────────────────
// Validates "HH:MM" format
export function isValidTime(time: string | null | undefined): boolean {
  if (!time) return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}