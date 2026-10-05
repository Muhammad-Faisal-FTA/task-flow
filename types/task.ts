// types/task.ts

type DatabaseId = string;

// ─── Repeat frequency ─────────────────────────────────────────────────────────
export type RepeatFrequency =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export type TaskPriority = "A" | "B" | "C" | "D";

// ─── Task status (derived at read time — never stored in DB) ──────────────────
export type TaskStatus =
  | "overdue"    // dueDate < today, not completed
  | "today"      // dueDate === today
  | "tomorrow"   // dueDate === tomorrow
  | "next_week"  // dueDate within next 7 days
  | "future"     // dueDate > 7 days from now
  | "nodate";    // no dueDate set

// ─── TaskList document shape (mirrors MongoDB) ────────────────────────────────
export interface ITaskList {
  id: DatabaseId;
  userId: DatabaseId;            // owner
  name: string;
  color: string;                 // hex e.g. "#1E8BC3"
  isDefault: boolean;            // true for auto-created "Default" list
  createdAt: Date;
  updatedAt: Date;
}

// ─── Task document shape (mirrors MongoDB) ────────────────────────────────────
export interface ITask {
  id: DatabaseId;
  userId: DatabaseId;            // owner — indexed
  listId: DatabaseId;            // ref → TaskList — indexed
  title: string;
  completed: boolean;
  completedAt: Date | null;      // when it was completed
  dueDate: Date | null;          // indexed
  dueTime: string | null;        // "HH:MM" — no timezone issues
  startTime: string | null;
  endTime: string | null;
  priority: TaskPriority;
  cdfTracking: boolean;
  repeat: RepeatFrequency;
  repeatDays: number[];
  repeatEndDate: Date | null;
  deletedAt: Date | null;        // null = active, Date = soft deleted (FR-15)
  createdAt: Date;
  updatedAt: Date;
  links: TaskLink[];          // FR-11 — array of links attached to task (empty if none)
}

// ─── API response shapes (safe — no Mongoose internals) ──────────────────────

// Single task returned to client
export interface TaskDTO {
  id: string;
  userId: string;
  listId: string;
  title: string;
  completed: boolean;
  completedAt: string | null;    // ISO string
  dueDate: string | null;        // "YYYY-MM-DD"
  dueTime: string | null;        // "HH:MM"
  startTime: string | null;      // "HH:MM"
  endTime: string | null;        // "HH:MM"
  priority: TaskPriority;
  cdfTracking: boolean;
  repeat: RepeatFrequency;
  repeatDays: number[];
  repeatEndDate: string | null;
  status: TaskStatus;            // derived — not in DB
  deletedAt: string | null;      // ISO string — for undo (FR-15)
  createdAt: string;
  updatedAt: string;
  links: TaskLink[];        // FR-11 — array of links attached to task (empty if none)
}

// Single list returned to client
export interface TaskListDTO {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefault: boolean;
  taskCount: number;             // live count from aggregation
  overdueCount: number;          // live count from aggregation
  createdAt: string;
  updatedAt: string;
}

// ─── Grouped tasks response (FR-06) ──────────────────────────────────────────
export interface GroupedTasks {
  overdue:   TaskDTO[];
  today:     TaskDTO[];
  tomorrow:  TaskDTO[];
  next_week: TaskDTO[];
  future:    TaskDTO[];
  nodate:    TaskDTO[];
}

// ─── API input shapes (used in routes + Zod schemas) ─────────────────────────
export interface CreateTaskInput {
  title: string;
  listId: string;
  dueDate?: string | null;       // "YYYY-MM-DD"
  dueTime?: string | null;       // "HH:MM"
  startTime?: string | null;     // "HH:MM"
  endTime?: string | null;       // "HH:MM"
  priority?: TaskPriority;
  cdfTracking?: boolean;
  repeat?: RepeatFrequency;
  repeatDays?: number[];
  repeatEndDate?: string | null;
  links?: TaskLink[];           // FR-11 — optional array of links to attach to task
}

export interface UpdateTaskInput {
  title?: string;
  listId?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  priority?: TaskPriority;
  cdfTracking?: boolean;
  repeat?: RepeatFrequency;
  repeatDays?: number[];
  repeatEndDate?: string | null;
  completed?: boolean;
  toggle?: boolean;
  restore?: boolean;
  links?: TaskLink[];          // FR-11 — optional array of links to replace existing ones
}

export interface CreateListInput {
  name: string;
  color: string;
}

export interface UpdateListInput {
  name?: string;
  color?: string;
}

// ─── Query params for GET /api/tasks ─────────────────────────────────────────
export interface TaskQueryParams {
  listId?: string;               // filter by list
  grouped?: boolean;             // return GroupedTasks shape
  includeCompleted?: boolean;    // include completed tasks
  includeDeleted?: boolean;      // include soft-deleted (for undo)
  search?: string;               // FR-10 — search by title
}

// ─── Task link ────────────────────────────────────────────────────────────────
export interface TaskLink {
  id:   string;    // client-generated UUID
  name: string;    // display name e.g. "Design Doc"
  url:  string;    // full URL e.g. "https://..."
}
