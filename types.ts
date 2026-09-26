



// types/index.ts
// Re-exports + legacy UI types
// Bridges old component imports (@/types) with new DTO types (@/types/task)

export type { TaskStatus, RepeatFrequency} from "@/types/task";
import type { TaskLink } from "@/types/task";


// ─── Screen ───────────────────────────────────────────────────────────────────
export type Screen = "home" | "detail" | "lists";

// ─── UI Task type ─────────────────────────────────────────────────────────────
// Used by components — mirrors TaskDTO but simpler
export interface Task {
  id:            string;
  title:         string;
  listId:        string;
  completed:     boolean;
  dueDate:       string | null;   // "YYYY-MM-DD"
  dueTime:       string | null;   // "HH:MM"
  startTime?:    string | null;   // "HH:MM" — optional timeline start
  endTime?:      string | null;   // "HH:MM" — optional timeline end
  repeat:        "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";
  status:        "overdue" | "today" | "tomorrow" | "next_week" | "future" | "nodate";
  hasRepeatIcon: boolean;
  links:         TaskLink[];       // ← add this
}

// ─── UI TaskList type ─────────────────────────────────────────────────────────
export interface TaskList {
  id:           string;
  name:         string;
  color:        string;
  taskCount:    number;
  overdueCount: number;
}
// ─── UI TaskSection type ─────────────────────────────────────────────────────
export interface TaskSection {
  title: string;
  tasks: Task[];
}

export interface AppState {
  updateList: (id: string, data: { name?: string; color?: string }) => void;
}