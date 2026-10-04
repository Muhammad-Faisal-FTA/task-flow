"use client";

import { useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { X } from "lucide-react";
import { TaskCheckbox } from "@/components/task/TaskCheckbox";
import type { TaskPriority } from "@/types/task";
import type { Task, TaskList } from "@/types";

const DAY_START = 0;
const DAY_END = 24 * 60;
const HOUR_HEIGHT = 64;

interface TaskTimelineProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggle: (taskId: string) => Promise<void>;
  isToggling: (taskId: string) => boolean;
  date: string;
  lists: TaskList[];
  selectedListId: string | null;
  onQuickAdd: (input: {
    title: string;
    listId: string;
    date: string;
    time: string;
    priority: TaskPriority;
    cdfTracking: boolean;
  }) => Promise<boolean>;
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

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute.toString().padStart(2, "0")} ${period}`;
}

export function TaskTimeline({
  tasks,
  onTaskClick,
  onToggle,
  isToggling,
  date,
  lists,
  selectedListId,
  onQuickAdd,
}: TaskTimelineProps) {
  const [quickTime, setQuickTime] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [listId, setListId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("C");
  const [cdfTracking, setCdfTracking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const timedTasks = tasks
    .filter((task) => task.dueTime)
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

  const overlapGroups: { end: number; items: typeof timedTasks }[] = [];
  for (const item of timedTasks) {
    const group = overlapGroups[overlapGroups.length - 1];
    if (!group || item.start >= group.end) {
      overlapGroups.push({ end: item.end, items: [item] });
    } else {
      group.items.push(item);
      group.end = Math.max(group.end, item.end);
    }
  }
  const positioned = overlapGroups.flatMap(({ items }) => {
    const lanes: { end: number }[] = [];
    const assigned = items.map((item) => {
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
    return assigned.map((item) => ({ ...item, laneCount }));
  });
  const height = (DAY_END - DAY_START) * (HOUR_HEIGHT / 60);
  const displayDate = new Date(`${date}T00:00:00`);

  const beginQuickAdd = (time: string) => {
    setQuickTime(time);
    setTitle("");
    setPriority("C");
    setCdfTracking(true);
    setListId(selectedListId ?? lists.find((list) => list.isDefault)?.id ?? lists[0]?.id ?? "");
  };

  const openQuickAdd = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const minute = Math.max(0, Math.min(DAY_END - 15, ((event.clientY - bounds.top) / HOUR_HEIGHT) * 60));
    const snappedMinute = Math.floor(minute / 15) * 15;
    const hour = Math.floor(snappedMinute / 60);
    const minutePart = snappedMinute % 60;
    beginQuickAdd(`${hour.toString().padStart(2, "0")}:${minutePart.toString().padStart(2, "0")}`);
  };

  const saveQuickTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quickTime || !title.trim() || !listId || isSaving) return;
    setIsSaving(true);
    try {
      const saved = await onQuickAdd({
        title: title.trim(),
        listId,
        date,
        time: quickTime,
        priority,
        cdfTracking,
      });
      if (saved) setQuickTime(null);
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className="flex flex-col items-center leading-none">
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)" }}
          >
            {displayDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
          </span>
          <span
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-full font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)", fontSize: "var(--text-md)" }}
          >
            {displayDate.getDate()}
          </span>
          <span
            className="mt-1"
            style={{ fontSize: "10px", color: "var(--color-text-hint)" }}
          >
            {displayDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        </div>
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
          onClick={openQuickAdd}
          role="button"
          tabIndex={0}
          aria-label="Click a time to add a task"
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              beginQuickAdd("09:00");
            }
          }}
        >
          <span
            className="pointer-events-none absolute left-2 top-2 z-[1] rounded px-1.5 py-1"
            style={{ backgroundColor: "var(--color-bg-card)", color: "var(--color-text-hint)", fontSize: "var(--text-xs)" }}
          >
            Click a time to add a task
          </span>
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

          {positioned.map(({ task, start, end, lane, laneCount }) => {
            const top = Math.max(0, start - DAY_START) * (HOUR_HEIGHT / 60);
            const blockHeight = Math.max(30, end - start) * (HOUR_HEIGHT / 60);
            const gap = 4;
            const width = `calc(${100 / laneCount}% - ${gap}px)`;
            const left = `calc(${(lane * 100) / laneCount}% + ${gap / 2}px)`;

            return (
              <div
                key={task.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onTaskClick(task);
                }}
                className="absolute flex gap-2 overflow-hidden rounded-[8px] px-2 py-1 text-left shadow-card transition-transform active:scale-[0.98]"
                style={{
                  top,
                  height: blockHeight,
                  left,
                  width,
                  zIndex: 2,
                  backgroundColor: task.completed
                    ? "color-mix(in srgb, var(--color-primary) 35%, var(--color-bg-card))"
                    : "var(--color-primary)",
                  color: "var(--color-text-primary)",
                  opacity: task.completed ? 0.72 : 1,
                }}
              >
                <TaskCheckbox
                  taskId={task.id}
                  completed={task.completed}
                  onToggle={onToggle}
                  isToggling={isToggling(task.id)}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className="block truncate font-semibold"
                    style={{
                      fontSize: "var(--text-sm)",
                      textDecoration: task.completed ? "line-through" : "none",
                      opacity: task.completed ? 0.6 : 1,
                    }}
                  >
                    {task.title}
                  </span>
                  <span className="block truncate" style={{ fontSize: "var(--text-xs)", opacity: 0.8 }}>
                    {formatTime(task.startTime ?? task.dueTime!)}
                    {task.endTime ? ` - ${formatTime(task.endTime)}` : " - 1 hr"}
                  </span>
                  <span className="mt-1 inline-block rounded px-1 font-semibold" style={{ fontSize: "10px", backgroundColor: "rgba(255,255,255,0.2)" }}>
                    {task.priority ?? "C"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {quickTime && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isSaving && setQuickTime(null)}
        >
          <form
            onSubmit={saveQuickTask}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-card p-5 shadow-card"
            style={{ backgroundColor: "var(--color-bg-card)", color: "var(--color-text-primary)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold" style={{ fontSize: "var(--text-md)" }}>Quick task</p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-hint)" }}>
                  {displayDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
              <button type="button" aria-label="Close quick task form" onClick={() => setQuickTime(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mb-3 block">
              <span className="mb-1 block" style={{ fontSize: "var(--text-xs)" }}>Task name</span>
              <input
                autoFocus
                required
                maxLength={255}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What needs to get done?"
                className="auth-input w-full"
              />
            </label>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block" style={{ fontSize: "var(--text-xs)" }}>Time</span>
                <input type="time" required value={quickTime} onChange={(event) => setQuickTime(event.target.value)} className="auth-input w-full" />
              </label>
              <label className="block">
                <span className="mb-1 block" style={{ fontSize: "var(--text-xs)" }}>Priority</span>
                <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} className="auth-input w-full">
                  {(["A", "B", "C", "D"] as TaskPriority[]).map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            </div>
            {lists.length > 1 && (
              <label className="mb-3 block">
                <span className="mb-1 block" style={{ fontSize: "var(--text-xs)" }}>Task list</span>
                <select value={listId} onChange={(event) => setListId(event.target.value)} className="auth-input w-full">
                  {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
                </select>
              </label>
            )}
            <label className="mb-4 flex items-center gap-2" style={{ fontSize: "var(--text-sm)" }}>
              <input type="checkbox" checked={cdfTracking} onChange={(event) => setCdfTracking(event.target.checked)} />
              Track this task in CDF
            </label>
            <button
              type="submit"
              disabled={isSaving || !listId}
              className="w-full rounded-btn px-4 py-3 font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {isSaving ? "Saving..." : "Add task"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
