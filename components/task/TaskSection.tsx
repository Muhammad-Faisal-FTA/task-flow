import { TaskCard } from "./TaskCard";
import type { Task, TaskList, TaskStatus } from "@/types";
import { cn } from "@/lib/cn";

const LABEL_COLOR: Record<TaskStatus, string> = {
  overdue: "text-status-overdue",
  soon: "text-status-soon",
  today: "text-status-today",
  tomorrow: "text-brand-highlight",
  future: "text-text-date",
  nodate: "text-status-nodate",
};

const LABEL_DOT: Record<TaskStatus, string> = {
  overdue: "bg-status-overdue",
  soon: "bg-status-soon",
  today: "bg-status-today",
  tomorrow: "bg-brand-highlight",
  future: "bg-text-date",
  nodate: "bg-status-nodate",
};

interface TaskSectionProps {
  label: string;
  status: TaskStatus;
  tasks: Task[];
  lists: TaskList[];
  onToggle: (id: string) => void;
  onClick: (task: Task) => void;
}

export function TaskSection({ label, status, tasks, lists, onToggle, onClick }: TaskSectionProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-5 animate-slide-up">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", LABEL_DOT[status])} />
        <span
          className={cn(
            "text-[11px] font-semibold tracking-[1.5px] uppercase",
            LABEL_COLOR[status]
          )}
        >
          {label}
        </span>
        <span className="text-[11px] text-text-tag ml-auto">{tasks.length}</span>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2">
        {tasks.map(task => {
          const list = lists.find(l => l.id === task.listId);
          return (
            <TaskCard
              key={task.id}
              task={task}
              list={list}
              onToggle={onToggle}
              onClick={onClick}
            />
          );
        })}
      </div>
    </div>
  );
}
