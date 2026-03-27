// Type definitions for TaskFlow application

export type TaskStatus = "overdue" | "soon" | "today" | "tomorrow" | "future" | "nodate";

export interface Task {
  id: string;
  title: string;
  listId: string;
  completed: boolean;
  dueDate: string | null;
  dueTime: string | null;
  repeat: "none" | "daily" | "weekly" | "monthly";
  status: TaskStatus;
  hasRepeatIcon: boolean;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  overdueCount: number;
}

export interface TaskSection {
  label: string;
  status: TaskStatus;
  tasks: Task[];
}

export type Screen = "home" | "detail" | "lists";

export interface AppState {
  screen: Screen;
  navigate: (screen: Screen) => void;
  goBack: () => void;
  tasks: Task[];
  allTasks: Task[];
  lists: TaskList[];
  filterListId: string | null;
  setFilterListId: (id: string | null) => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  openTask: (task: Task) => void;
  openNewTask: () => void;
  saveTask: (task: Task) => boolean;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  addList: (name: string, color: string) => void;
  deleteList: (id: string) => void;
  toast: string;
  showToast: (message: string) => void;
}