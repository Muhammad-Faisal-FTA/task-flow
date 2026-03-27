import type { Task, TaskList, TaskSection } from "@/types";

// ─── List color palette (matches brand)──────────────────────────────────────
export const LIST_COLORS: string[] = [
  "#1E8BC3",
  "#E53935",
  "#43A047",
  "#F57C00",
  "#7B1FA2",
  "#29B6F6",
];

// ─── Task Lists ───────────────────────────────────────────────────────────────
export const INITIAL_LISTS: TaskList[] = [
  { id: "default", name: "Default", color: "#1E8BC3", taskCount: 4, overdueCount: 4 },
  { id: "work",    name: "Work",    color: "#E53935", taskCount: 3, overdueCount: 2 },
  { id: "personal",name: "Personal",color: "#43A047", taskCount: 2, overdueCount: 0 },
  { id: "shopping",name: "Shopping",color: "#F57C00", taskCount: 0, overdueCount: 0 },
  { id: "wishlist",name: "Wishlist",color: "#7B1FA2", taskCount: 0, overdueCount: 0 },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    title: "Resume: Full-stack project",
    listId: "default",
    completed: false,
    dueDate: "2025-03-20",
    dueTime: "21:30",
    repeat: "none",
    status: "overdue",
  },
  {
    id: "t2",
    title: "AI lectures",
    listId: "work",
    completed: false,
    dueDate: "2025-03-25",
    dueTime: null,
    repeat: "weekly",
    status: "overdue",
    hasRepeatIcon: true,
  },
  {
    id: "t3",
    title: "DSA: strings & questions",
    listId: "work",
    completed: false,
    dueDate: "2025-03-26",
    dueTime: "19:00",
    repeat: "none",
    status: "today",
  },
  {
    id: "t4",
    title: "Qur'an + azkar",
    listId: "personal",
    completed: false,
    dueDate: "2025-03-27",
    dueTime: "07:00",
    repeat: "daily",
    status: "tomorrow",
    hasRepeatIcon: true,
  },
];

// ─── Sections ─────────────────────────────────────────────────────────────────
export const TASK_SECTIONS: TaskSection[] = [
  { label: "OVERDUE",  status: "overdue",  tasks: INITIAL_TASKS.filter(t => t.status === "overdue") },
  { label: "TODAY",    status: "today",    tasks: INITIAL_TASKS.filter(t => t.status === "today") },
  { label: "TOMORROW", status: "tomorrow", tasks: INITIAL_TASKS.filter(t => t.status === "tomorrow") },
];

// ─── Repeat Labels ─────────────────────────────────────────────────────────────
export const REPEAT_OPTIONS = [
  { value: "none",     label: "No Repeat" },
  { value: "daily",    label: "Every Day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly",   label: "Once a Week" },
  { value: "monthly",  label: "Once a Month" },
  { value: "yearly",   label: "Once a Year" },
] as const;
