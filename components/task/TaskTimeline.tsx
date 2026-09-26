"use client";

import type { TaskDTO } from "@/types/task";

const DAY_START = 0;
const DAY_END = 24 * 60;
const HOUR_HEIGHT = 64;

interface TaskTimelineProps {
  tasks: TaskDTO[];
  onTaskClick: (task: TaskDTO) => void;
}

function toMinutes(value: string | null | undefined, fallback: number) {
  if (!value) return fallback;
  const [hours, minutes] = value.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes)
    ? hours * 60 + minutes
    : fallback;
}

function formatHour(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12} ${period}`;
}

export function TaskTimeline({ tasks, onTaskClick }: TaskTimelineProps) {
  const timedTasks = tasks
    .filter((task) => task.dueTime && !task.completed)
    .map((task) => {
      const start = toMinutes(task.startTime ?? task.dueTime, DAY_START);
      const end = Math.max(
        toMinutes(task.endTime, start + 60),
        start + 30,
      );
      return { task, start, end };
    })
    .filter(({ start }) => start < DAY_END)
    .sort((a, b) => a.start - b.start);

  if (timedTasks.length === 0) return null;

  const lanes: { end: number }[] = [];
  const positioned = timedTasks.map((item) => {
    let lane = lanes.findIndex((entry) => entry.end <= item.start);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push({ end: item.end });
    } else {
      lanes[lane].end = item.end;
    }
    return { ...item, lane };
  });
  const laneCount = Math.max(1, lanes.length);
  const height = (DAY_END - DAY_START) * (HOUR_HEIGHT / 60);

  return (
    <section
      className="mb-5 w-full overflow-hidden rounded-card"
      style={{ border: "1px solid var(--color-border-default)" }}
      aria-label="Timed tasks"
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          backgroundColor: "var(--color-bg-card)",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <span
          className="font-semibold tracking-widest uppercase"
          style={{ fontSize: "var(--text-xs)", color: "var(--color-text-accent)" }}
        >
          Schedule
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-hint)" }}>
          {timedTasks.length} timed
        </span>
      </div>

      <div className="flex" style={{ backgroundColor: "var(--color-bg-app)" }}>
        <div className="w-12 flex-shrink-0 sm:w-14" style={{ height }}>
          {Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, index) => (
            <div
              key={index}
              className="flex items-start justify-end pr-2"
              style={{ height: HOUR_HEIGHT, color: "var(--color-text-hint)", fontSize: "var(--text-xs)" }}
            >
              {formatHour(DAY_START / 60 + index)}
            </div>
          ))}
        </div>

        <div
          className="relative min-w-0 flex-1"
          style={{ height, padding: "0 4px" }}
        >
          {Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, index) => (
            <div
              key={index}
              className="absolute inset-x-0 border-t"
              style={{
                top: index * HOUR_HEIGHT,
                borderColor: "var(--color-border-default)",
              }}
            />
          ))}

          {positioned.map(({ task, start, end, lane }) => {
            const top = Math.max(0, start - DAY_START) * (HOUR_HEIGHT / 60);
            const blockHeight = Math.max(30, end - start) * (HOUR_HEIGHT / 60);
            const gap = 4;
            const width = `calc(${100 / laneCount}% - ${gap}px)`;
            const left = `calc(${(lane * 100) / laneCount}% + ${gap / 2}px)`;

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onTaskClick(task)}
                className="absolute overflow-hidden rounded-[8px] px-2 py-1 text-left shadow-card transition-transform active:scale-[0.98]"
                style={{
                  top,
                  height: blockHeight,
                  left,
                  width,
                  zIndex: 2,
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-text-primary)",
                }}
              >
                <span className="block truncate font-semibold" style={{ fontSize: "var(--text-sm)" }}>
                  {task.title}
                </span>
                <span className="block truncate" style={{ fontSize: "var(--text-xs)", opacity: 0.8 }}>
                  {task.dueTime}
                  {task.endTime ? ` - ${task.endTime}` : " - 1 hr"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
