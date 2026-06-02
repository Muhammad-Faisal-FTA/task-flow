
// components/task/TaskCard.tsx
"use client";

import { useState, useEffect } from "react";
import { CalendarDays, AlertCircle, RepeatIcon } from "lucide-react";
import { TaskCheckbox } from "@/components/task/TaskCheckbox";
import { cn } from "@/lib/cn";
import type { TaskDTO, TaskListDTO } from "@/types/task";

const LEFT_BORDER: Record<string, string> = {
  overdue: "var(--color-overdue)",
  soon: "var(--color-warning)",
  today: "var(--color-today)",
  tomorrow: "var(--color-accent)",
  next_week: "var(--color-primary)",
  future: "var(--color-text-secondary)",
  nodate: "var(--color-text-hint)",
};

const DATE_COLOR: Record<string, string> = {
  overdue: "var(--color-overdue)",
  soon: "var(--color-warning)",
  today: "var(--color-today)",
  tomorrow: "var(--color-accent)",
  next_week: "var(--color-primary)",
  future: "var(--color-text-secondary)",
  nodate: "var(--color-text-hint)",
};

interface TaskCardProps {
  task: TaskDTO;
  list?: TaskListDTO;
  onToggle: (taskId: string) => Promise<void>;
  onClick: (task: TaskDTO) => void;
  isToggling?: boolean;
}

export function TaskCard({
  task,
  list,
  onToggle,
  onClick,
  isToggling = false,
}: TaskCardProps) {
  // Controls fade-out + slide-up animation on complete
  const [isCompleting, setIsCompleting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleToggle = async (taskId: string) => {
    if (!task.completed) {
      // About to be completed — start exit animation
      setIsCompleting(true);
      await onToggle(taskId);
      // Wait for animation then hide
      setTimeout(() => setIsVisible(false), 600);
    } else {
      // Uncompleting — just toggle, no animation
      await onToggle(taskId);
    }
  };

  // Don't render if animated out
  if (!isVisible) return null;

  const dateStr = task.dueDate
    ? formatDisplayDate(task.dueDate, task.status)
    : null;

  return (
    <div
      onClick={() => !isCompleting && onClick(task)}
      className={cn(
        "flex items-start gap-3 rounded-card shadow-card cursor-pointer select-none",
        "transition-all duration-200 active:scale-[0.98]",
        // Exit animation when completing
        isCompleting && "opacity-0 -translate-y-2 scale-95 pointer-events-none",
      )}
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderLeft: `3px solid ${LEFT_BORDER[task.status] ?? "var(--color-border-default)"}`,
        padding: "14px 16px",
        marginBottom: "8px",
        transition: isCompleting
          ? "opacity 0.5s ease, transform 0.5s ease"
          : "transform 0.15s ease",
      }}
    >
      {/* Checkbox */}
      <TaskCheckbox
        taskId={task.id}
        completed={task.completed}
        onToggle={handleToggle}
        isToggling={isToggling}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <p
          className="leading-snug truncate transition-all duration-300"
          style={{
            fontSize: "var(--text-md)",
            color: task.completed
              ? "var(--color-text-hint)"
              : "var(--color-text-primary)",
            textDecoration:
              isCompleting || task.completed ? "line-through" : "none",
            opacity: task.completed ? 0.6 : 1,
          }}
        >
          {task.title}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Due date */}
          {dateStr && (
            <span
              className="flex items-center gap-1"
              style={{
                fontSize: "var(--text-sm)",
                color: DATE_COLOR[task.status] ?? "var(--color-text-hint)",
              }}
            >
              {task.status === "overdue" ? (
                <AlertCircle style={{ width: "11px", height: "11px" }} />
              ) : (
                <CalendarDays style={{ width: "11px", height: "11px" }} />
              )}
              {dateStr}
              {task.dueTime && (
                <span style={{ opacity: 0.8 }}>
                  · {formatTime(task.dueTime)}
                </span>
              )}
            </span>
          )}

          {/* Link on card */}
          {task.links && task.links.length > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-badge"
              style={{
                fontSize:        "var(--text-xs)",
                color:           "var(--color-primary)",
                backgroundColor: "rgba(30,139,195,0.1)",
                border:          "1px solid rgba(30,139,195,0.2)",
              }}
            >
              <span style={{ fontSize: "10px" }}>🔗</span>
              <span style={{ fontWeight: 600 }}>
                {task.links.length} link{task.links.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* List badge */}
          {/* {list && !list.isDefault && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-badge"
              style={{
                fontSize:        "var(--text-xs)",
                color:           list.color ?? "var(--color-primary)",
                backgroundColor: list.color
                  ? `${list.color}18`
                  : "rgba(30,139,195,0.1)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: list.color ?? "var(--color-primary)" }}
              />
              {list.name}
            </span>
          )} */}

          {/* List badge — only show for non-default lists */}
          {list && list.id !== "default" && !(list as any).isDefault && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-badge"
              style={{
                fontSize: "var(--text-xs)",
                color: list.color ?? "var(--color-primary)",
                backgroundColor: list.color
                  ? `${list.color}18`
                  : "rgba(30,139,195,0.1)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: list.color ?? "var(--color-primary)",
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {list.name}
            </span>
          )}

          {/* Repeat icon */}
          {task.repeat !== "none" && (
            <RepeatIcon
              style={{
                width: "11px",
                height: "11px",
                color: "var(--color-repeat)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDisplayDate(iso: string, status: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tom = new Date(today);
  tom.setDate(today.getDate() + 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, tom)) return "Tomorrow";

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
