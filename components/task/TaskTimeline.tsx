"use client";

import { useEffect, useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { TaskTimelineGrid } from "@/components/task/TaskTimelineGrid";
import type { TaskPriority } from "@/types/task";
import type { Task, TaskList } from "@/types";
import { positionTimelineTasks } from "@/utils/positionTimelineTasks";

const DAY_START = 0;
const HOUR_HEIGHT = 64;

function shiftDate(date: string, days: number) {
  const shifted = new Date(`${date}T00:00:00`);
  shifted.setDate(shifted.getDate() + days);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(shifted.getDate()).padStart(2, "0")}`;
}

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
  const [cdfTracking, setCdfTracking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(date);
  useEffect(() => {
    const update = () => setNow(new Date());
    const interval = window.setInterval(update, 15_000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
    };
  }, []);
  useEffect(() => setSelectedDate(date), [date]);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = selectedDate === today;
  const visibleStart = DAY_START;
  const visibleEnd = 24;
  const positioned = positionTimelineTasks(tasks.filter((task) => task.dueDate?.slice(0, 10) === selectedDate));
  const height = (visibleEnd - visibleStart) * HOUR_HEIGHT;
  const currentMinute = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const displayDate = new Date(`${selectedDate}T00:00:00`);

  const beginQuickAdd = (time: string) => {
    setQuickTime(time);
    setTitle("");
    setPriority("C");
    setCdfTracking(false);
    setListId(selectedListId ?? lists.find((list) => list.isDefault)?.id ?? lists[0]?.id ?? "");
  };

  const openQuickAdd = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const minute = Math.max(visibleStart * 60, Math.min(visibleEnd * 60 - 15, visibleStart * 60 + ((event.clientY - bounds.top) / HOUR_HEIGHT) * 60));
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
        date: selectedDate,
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
      className="mb-5 w-full rounded-card"
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedDate((current) => shiftDate(current, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: "var(--color-text-primary)" }}
            aria-label="Show previous day"
            title="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-14 flex-col items-center leading-none">
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
          <button
            type="button"
            onClick={() => setSelectedDate((current) => shiftDate(current, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: "var(--color-text-primary)" }}
            aria-label="Show next day"
            title="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-hint)" }}>
          {positioned.length} timed
        </span>
      </div>

      <TaskTimelineGrid
        key={`${selectedDate}-${isToday}`}
        tasks={positioned}
        startHour={visibleStart}
        endHour={visibleEnd}
        height={height}
        initialScrollHour={isToday ? now.getHours() : 0}
        currentMinute={currentMinute}
        showCurrentTime={isToday}
        onClick={openQuickAdd}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            beginQuickAdd("09:00");
          }
        }}
        onTaskClick={onTaskClick}
        onToggle={onToggle}
        isToggling={isToggling}
      />

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
