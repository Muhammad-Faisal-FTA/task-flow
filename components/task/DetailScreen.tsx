// components/task/DetailScreen.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  Bell,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { Checkbox } from "@/components/ui/Checkbox";
import { SelectField } from "@/components/ui/SelectField";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { LinksSection } from "@/components/task/LinksSection";

import { cn } from "@/lib/cn";
import { REPEAT_OPTIONS } from "@/lib/data";
import type { Task, TaskList } from "@/types";
import type { TaskPriority } from "@/types/task";
import { TaskLink } from "@/types/task";



// ─── Types ────────────────────────────────────────────────────────────────────
interface DetailScreenState {
  selectedTask: Task | null;
  saveTask: (
    task: Omit<Task, "id" | "status" | "hasRepeatIcon"> & { id?: string },
  ) => boolean | Promise<boolean>;
  deleteTask: (id: string) => void;
  goBack: () => void;
  lists: TaskList[];
}

interface DetailScreenProps {
  state: DetailScreenState;
}

// ─── Add this helper above the component ──────────────────────────────────────
async function shareTask(task: Task): Promise<void> {
  const text = [
    `📋 ${task.title}`,
    task.dueDate
      ? `📅 Due: ${new Date(task.dueDate + "T00:00:00").toLocaleDateString(
          "en-US",
          {
            weekday: "short",
            month: "short",
            day: "numeric",
          },
        )}`
      : null,
    task.dueTime ? `⏰ Time: ${formatDisplayTime(task.dueTime)}` : null,
    task.repeat !== "none" ? `🔁 Repeats: ${task.repeat}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    if (navigator.share) {
      await navigator.share({
        title: task.title,
        text,
      });
    } else {
      // Fallback — copy to clipboard
      await navigator.clipboard.writeText(text);
      // We can't call showToast here — use a custom event or just alert
      alert("Task copied to clipboard!");
    }
  } catch (err) {
    // User cancelled share — not an error
    if (err instanceof Error && err.name !== "AbortError") {
      console.error("[shareTask]", err);
    }
  }
}

const REPEAT_DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDisplayDate(iso: string | null): string {
  if (!iso) return "No date";
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
    return "Today";

  if (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  )
    return "Tomorrow";

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDisplayTime(time: string | null): string {
  if (!time) return "No time";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DetailScreen({ state }: DetailScreenProps) {
  const { selectedTask, saveTask, deleteTask, goBack, lists } = state;

  const [form, setForm] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openPicker, setOpenPicker] = useState<"date" | "time" | null>(null);

  useEffect(() => {
    if (selectedTask) {
      setForm({
        ...selectedTask,
        priority: selectedTask.priority ?? "C",
        cdfTracking: selectedTask.cdfTracking ?? true,
      });
      setOpenPicker(null);
    }
  }, [selectedTask]);

  if (!form) return null;

  const isNew = !form.id;
  const listOptions = lists.map((l) => ({ value: l.id, label: l.name }));
  const selectedList = lists.find((l) => l.id === form.listId);
  const canSave = Boolean(
    form.title.trim() &&
    !isSaving &&
    !(form.repeat === "custom" && form.repeatDays.length === 0) &&
    !(form.dueDate && form.repeatEndDate && form.repeatEndDate < form.dueDate),
  );

  const update = <K extends keyof Task>(key: K, val: Task[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: val } : prev));

  const togglePicker = (picker: "date" | "time") =>
    setOpenPicker((prev) => (prev === picker ? null : picker));

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const saved = await saveTask({
        id: form.id || undefined,
        title: form.title,
        listId: form.listId,
        completed: form.completed,
        priority: form.priority ?? "C",
        cdfTracking: form.cdfTracking ?? true,
        dueDate: form.dueDate,
        dueTime: form.dueTime,
        startTime: form.startTime ?? form.dueTime,
        endTime: form.endTime ?? null,
        repeat: form.repeat,
        repeatDays: form.repeatDays,
        repeatEndDate: form.repeatEndDate,
        links:     form.links ?? [],     // ← add this

      });
      if (saved) goBack();
    } finally {
      setIsSaving(false);
    }
  };

  const labelCls = "block font-semibold tracking-widest uppercase mb-2";
  const rowCls =
    "flex items-center justify-between rounded-card px-4 py-3 cursor-pointer transition-all duration-200 active:scale-[0.99]";

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--color-bg-app)" }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <HeaderBar
        title={isNew ? "New Task" : "Edit Task"}
        showBack
        onBack={goBack}
        rightAction={
          <div className="flex items-center gap-2">
            {/* Share button — only for existing tasks */}
            {!isNew && (
              <button
                onClick={() => shareTask(form)}
                className="w-9 h-9 flex items-center justify-center rounded-[8px] active:scale-90 transition-transform"
                style={{ backgroundColor: "var(--color-bg-card)" }}
                aria-label="Share task"
              >
                <Share2
                  className="w-4 h-4"
                  style={{ color: "var(--color-text-hint)" }}
                />
              </button>
            )}

            {/* Delete button — only for existing tasks */}
            {!isNew && (
              <button
                onClick={() => form.id && deleteTask(form.id)}
                className="w-9 h-9 flex items-center justify-center rounded-[8px] active:scale-90 transition-transform"
                style={{ backgroundColor: "var(--color-bg-card)" }}
                aria-label="Delete task"
              >
                <Trash2
                  className="w-4 h-4"
                  style={{ color: "var(--color-text-hint)" }}
                />
              </button>
            )}
          </div>
        }
      />
      {/* ── Scrollable content ──────────────────────────────────────── */}
      {/* ↓ padding-bottom reduced — save button no longer fixed       */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{
          padding: "20px 16px 24px",
          backgroundColor: "var(--color-bg-app)",
        }}
      >
        {/* Task title */}
        <div style={{ marginBottom: "20px" }}>
          <label
            className={labelCls}
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-accent)",
            }}
          >
            What is to be done?
          </label>
          <textarea
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Task name…"
            rows={2}
            className="auth-input resize-none leading-relaxed w-full"
          />
        </div>

        {/* Completed toggle */}
        <div
          className={rowCls}
          onClick={() => update("completed", !form.completed)}
          style={{
            marginBottom: "20px",
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={form.completed}
              onChange={() => update("completed", !form.completed)}
            />
            <span
              style={{
                fontSize: "var(--text-base)",
                color: "var(--color-text-secondary)",
              }}
            >
              Task finished?
            </span>
          </div>
          {form.completed && (
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-success)",
                backgroundColor: "rgba(67,160,71,0.1)",
                padding: "3px 8px",
                borderRadius: "var(--radius-btn)",
                fontWeight: 600,
              }}
            >
              Done ✓
            </span>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <SelectField
            label="Priority"
            value={form.priority ?? "C"}
            options={(["A", "B", "C", "D"] as TaskPriority[]).map((priority) => ({
              value: priority,
              label: `${priority} priority`,
            }))}
            onChange={(value) => update("priority", value as TaskPriority)}
          />
        </div>

        <div
          className={rowCls}
          onClick={() => update("cdfTracking", !(form.cdfTracking ?? true))}
          style={{
            marginBottom: "20px",
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={form.cdfTracking ?? true}
              onChange={() => update("cdfTracking", !(form.cdfTracking ?? true))}
            />
            <span style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
              Track this task in CDF
            </span>
          </div>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-hint)" }}>
            {(form.cdfTracking ?? true) ? "ON" : "OFF"}
          </span>
        </div>

        {/* Due date */}
        <div style={{ marginBottom: "12px" }}>
          <label
            className={labelCls}
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-accent)",
            }}
          >
            Due Date
          </label>

          {/* Date trigger */}
          <div
            className={rowCls}
            onClick={() => togglePicker("date")}
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: `1.5px solid ${
                openPicker === "date"
                  ? "var(--color-primary)"
                  : "var(--color-border-default)"
              }`,
              marginBottom: "8px",
            }}
          >
            <div className="flex items-center gap-3">
              <Calendar
                style={{
                  width: "16px",
                  height: "16px",
                  color: form.dueDate
                    ? "var(--color-primary)"
                    : "var(--color-text-hint)",
                }}
              />
              <span
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: form.dueDate ? 600 : 400,
                  color: form.dueDate
                    ? "var(--color-text-primary)"
                    : "var(--color-text-hint)",
                }}
              >
                {formatDisplayDate(form.dueDate)}
              </span>
            </div>
            {openPicker === "date" ? (
              <ChevronUp
                style={{
                  width: "16px",
                  height: "16px",
                  color: "var(--color-text-hint)",
                }}
              />
            ) : (
              <ChevronDown
                style={{
                  width: "16px",
                  height: "16px",
                  color: "var(--color-text-hint)",
                }}
              />
            )}
          </div>

          {/* Date picker inline */}
          {openPicker === "date" && (
            <div style={{ marginBottom: "8px" }}>
              <DatePicker
                value={form.dueDate}
                onChange={(val) => {
                  update("dueDate", val);
                  if (val) setOpenPicker(null);
                }}
                onClose={() => setOpenPicker(null)}
              />
            </div>
          )}

          {/* Time trigger — only when date set */}
          {form.dueDate && (
            <>
              <div
                className={rowCls}
                onClick={() => togglePicker("time")}
                style={{
                  backgroundColor: "var(--color-bg-card)",
                  border: `1.5px solid ${
                    openPicker === "time"
                      ? "var(--color-primary)"
                      : form.dueTime
                        ? "rgba(229,57,53,0.4)"
                        : "var(--color-border-default)"
                  }`,
                  marginBottom: "8px",
                }}
              >
                <div className="flex items-center gap-3">
                  <Clock
                    style={{
                      width: "16px",
                      height: "16px",
                      color: form.dueTime
                        ? "var(--color-overdue)"
                        : "var(--color-text-hint)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: form.dueTime ? 600 : 400,
                      color: form.dueTime
                        ? "var(--color-overdue)"
                        : "var(--color-text-hint)",
                    }}
                  >
                    {formatDisplayTime(form.dueTime)}
                  </span>
                </div>
                {openPicker === "time" ? (
                  <ChevronUp
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "var(--color-text-hint)",
                    }}
                  />
                ) : (
                  <ChevronDown
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "var(--color-text-hint)",
                    }}
                  />
                )}
              </div>

              {openPicker === "time" && (
                <div style={{ marginBottom: "8px" }}>
                  <TimePicker
                    value={form.dueTime}
                    onChange={(val) => update("dueTime", val)}
                  />
                </div>
              )}
            </>
          )}

          {/* Notification hint */}
          <div
            className="flex items-center gap-1.5 px-1"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-hint)",
            }}
          >
            <Bell style={{ width: "12px", height: "12px" }} />
            <span>Day summary 8AM · Notif at time</span>
          </div>
        </div>

        {/* Repeat */}
        {form.dueDate && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ marginBottom: "20px" }}>
            <label className="flex flex-col gap-2">
              <span className={labelCls} style={{ fontSize: "var(--text-xs)", color: "var(--color-text-accent)" }}>
                Start time
              </span>
              <input
                type="time"
                value={form.startTime ?? form.dueTime ?? ""}
                onChange={(event) => update("startTime", event.target.value || null)}
                className="auth-input w-full"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls} style={{ fontSize: "var(--text-xs)", color: "var(--color-text-accent)" }}>
                End time
              </span>
              <input
                type="time"
                value={form.endTime ?? ""}
                onChange={(event) => update("endTime", event.target.value || null)}
                className="auth-input w-full"
              />
            </label>
          </div>
        )}

        {/* Repeat */}
        <div style={{ marginBottom: "20px" }}>
          <SelectField
            label="Repeat"
            value={form.repeat}
            options={[...REPEAT_OPTIONS]}
            onChange={(val) => {
              const repeat = val as Task["repeat"];
              update("repeat", repeat);
              if (repeat === "none") update("repeatEndDate", null);
            }}
          />
        </div>

        {form.repeat === "custom" && (
          <fieldset className="mb-5">
            <legend className={labelCls} style={{ fontSize: "var(--text-xs)", color: "var(--color-text-accent)" }}>
              Repeat on
            </legend>
            <div className="grid grid-cols-7 gap-2">
              {REPEAT_DAYS.map(({ value, label }) => {
                const selected = form.repeatDays.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => update(
                      "repeatDays",
                      selected
                        ? form.repeatDays.filter((day) => day !== value)
                        : [...form.repeatDays, value].sort((a, b) => a - b),
                    )}
                    className="rounded-full py-2 text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: selected ? "var(--color-primary)" : "var(--color-bg-card)",
                      color: selected ? "#fff" : "var(--color-text-secondary)",
                      border: "1px solid var(--color-border-default)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {form.repeatDays.length === 0 && (
              <p role="alert" className="mt-2 text-xs" style={{ color: "var(--color-overdue)" }}>
                Select at least one day.
              </p>
            )}
          </fieldset>
        )}

        {form.repeat !== "none" && (
          <label className="mb-5 flex flex-col gap-2">
            <span className={labelCls} style={{ fontSize: "var(--text-xs)", color: "var(--color-text-accent)" }}>
              Repeat until (inclusive, optional)
            </span>
            <input
              type="date"
              value={form.repeatEndDate ?? ""}
              min={form.dueDate ?? undefined}
              onChange={(event) => update("repeatEndDate", event.target.value || null)}
              className="auth-input w-full"
            />
            {form.dueDate && form.repeatEndDate && form.repeatEndDate < form.dueDate && (
              <span role="alert" className="text-xs" style={{ color: "var(--color-overdue)" }}>
                End date cannot be before the first due date.
              </span>
            )}
          </label>
        )}

        {/* Task list */}
        <div style={{ marginBottom: "20px" }}>
          <SelectField
            label="Task List"
            value={form.listId}
            options={listOptions}
            onChange={(val) => update("listId", val)}
            dotColor={selectedList?.color}
          />
        </div>
        <LinksSection
          links={form.links ?? []}
          onChange={(val: TaskLink[]) => update("links", val)}
          />
        </div>
      {/* ── Save button — sticky at bottom of flex column ───────────── */}
      {/* ↓ NOT fixed — works correctly in both mobile panel + desktop  */}
      <div
        className="px-4 pb-6 pt-3 flex-shrink-0"
        style={{
          background:
            "linear-gradient(to top, var(--color-bg-app) 70%, transparent)",
        }}
      >
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-4 rounded-card font-semibold transition-all duration-200 active:scale-[0.98]"
          style={{
            fontSize: "var(--text-md)",
            color: "#ffffff",
            backgroundColor:
              canSave
                ? "var(--color-primary)"
                : "var(--color-bg-card)",
            cursor: canSave ? "pointer" : "not-allowed",
            opacity: canSave ? 1 : 0.6,
            boxShadow: "var(--shadow-fab)",
          }}
        >
          {isSaving ? "Saving…" : isNew ? "Add Task" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
