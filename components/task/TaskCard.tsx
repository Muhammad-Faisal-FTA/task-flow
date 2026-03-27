"use client";
import { CalendarDays, Clock, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { ListBadge, RepeatBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatDueDate, formatTime } from "@/lib/dateUtils";
import type { Task, TaskList, TaskStatus } from "@/types";

const STATUS_LEFT_BORDER: Record<TaskStatus, string> = {
  overdue: "border-l-status-overdue",
  soon: "border-l-status-soon",
  today: "border-l-status-today",
  tomorrow: "border-l-brand-highlight",
  future: "border-l-layer-3",
  nodate: "border-l-status-nodate",
};

const DATE_COLOR: Record<TaskStatus, string> = {
  overdue: "text-status-overdue",
  soon: "text-status-soon",
  today: "text-status-today",
  tomorrow: "text-text-date",
  future: "text-text-date",
  nodate: "text-status-nodate",
};

interface TaskCardProps {
  task: Task;
  list?: TaskList;
  onToggle: (id: string) => void;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, list, onToggle, onClick }: TaskCardProps) {
  const dateStr = formatDueDate(task.dueDate, task.status);
  const timeStr = task.dueTime ? formatTime(task.dueTime) : null;
  const DateIcon = task.status === "overdue" ? AlertCircle : CalendarDays;

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 rounded-card bg-layer-2 border-l-[3px] shadow-card cursor-pointer",
        "active:scale-[0.98] transition-transform duration-150 select-none",
        STATUS_LEFT_BORDER[task.status],
      )}
    >
      <Checkbox checked={task.completed} onChange={() => onToggle(task.id)} />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[15px] text-text-primary font-normal leading-snug truncate",
            task.completed && "line-through opacity-50",
          )}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Date */}
          {dateStr && (
            <span
              className={cn(
                "flex items-center gap-1 text-[12px]",
                DATE_COLOR[task.status],
              )}
            >
              <DateIcon className="w-3 h-3 flex-shrink-0" />
              {dateStr}
              {timeStr && <span className="opacity-80">· {timeStr}</span>}
            </span>
          )}

          {/* List badge */}
          {list && list.id !== "default" && (
            <ListBadge label={list.name} color={list.color} />
          )}

          {/* Repeat icon */}
          {task.hasRepeatIcon && <RepeatBadge />}
        </div>
      </div>
    </div>
  );
}
