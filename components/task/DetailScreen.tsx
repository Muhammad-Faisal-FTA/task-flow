"use client";
import { useState, useEffect } from "react";
import { Trash2, Bell } from "lucide-react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { Checkbox } from "@/components/ui/Checkbox";
import { SelectField } from "@/components/ui/SelectField";
import { cn } from "@/lib/cn";
import { REPEAT_OPTIONS } from "@/lib/data";
import type { AppState } from "@/hooks/useAppState";
import type { Task } from "@/types";

interface DetailScreenProps {
  state: AppState;
}

export function DetailScreen({ state }: DetailScreenProps) {
  const { selectedTask, saveTask, deleteTask, goBack, lists } = state;
  const [form, setForm] = useState<Task | null>(null);

  useEffect(() => {
    if (selectedTask) setForm({ ...selectedTask });
  }, [selectedTask]);

  if (!form) return null;

  const isNew = !form.id;
  const listOptions = lists.map(l => ({ value: l.id, label: l.name }));
  const selectedList = lists.find(l => l.id === form.listId);

  const update = <K extends keyof Task>(key: K, val: Task[K]) =>
    setForm(prev => prev ? { ...prev, [key]: val } : prev);

  const handleSave = () => {
    if (form) saveTask(form);
  };

  const inputCls =
    "w-full bg-layer-2 border border-layer-3/40 rounded-input px-4 py-3 text-[14px] text-text-primary placeholder:text-text-placeholder outline-none focus:border-brand-accent transition-colors";
  const labelCls =
    "block text-[11px] font-semibold tracking-widest uppercase text-brand-accent mb-2";

  return (
    <div className="flex flex-col h-full">
      <HeaderBar
        title={isNew ? "New Task" : "Edit Task"}
        showBack
        onBack={goBack}
        rightAction={
          !isNew && (
            <button
              onClick={() => form.id && deleteTask(form.id)}
              className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-layer-2 active:bg-status-overdue/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-text-tag" />
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28 space-y-5 scrollbar-none">

        {/* Task title */}
        <div>
          <label className={labelCls}>What is to be done?</label>
          <textarea
            value={form.title}
            onChange={e => update("title", e.target.value)}
            placeholder="Task name…"
            rows={2}
            className={cn(inputCls, "resize-none leading-relaxed")}
          />
        </div>

        {/* Finished toggle */}
        <div
          className="flex items-center gap-3 bg-layer-2 border border-layer-3/40 rounded-input px-4 py-3 cursor-pointer"
          onClick={() => update("completed", !form.completed)}
        >
          <Checkbox checked={form.completed} onChange={() => update("completed", !form.completed)} />
          <span className="text-[14px] text-text-date">Task finished?</span>
        </div>

        {/* Due date */}
        <div>
          <label className={labelCls}>Due Date</label>
          <div className="space-y-2">
            {/* Date picker row */}
            <div className="flex items-center gap-2 bg-layer-2 border border-layer-3/40 rounded-input px-4 py-3">
              <input
                type="date"
                value={form.dueDate ?? ""}
                onChange={e => update("dueDate", e.target.value || null)}
                className="flex-1 bg-transparent text-[14px] text-text-primary outline-none [color-scheme:dark]"
              />
            </div>

            {/* Time picker row */}
            <div
              className={cn(
                "flex items-center gap-2 bg-layer-2 border rounded-input px-4 py-3",
                form.dueTime ? "border-status-overdue/50" : "border-layer-3/40"
              )}
            >
              <input
                type="time"
                value={form.dueTime ?? ""}
                onChange={e => update("dueTime", e.target.value || null)}
                placeholder="No time"
                className={cn(
                  "flex-1 bg-transparent text-[14px] outline-none [color-scheme:dark]",
                  form.dueTime ? "text-status-overdue font-semibold" : "text-text-placeholder"
                )}
              />
              {form.dueTime && (
                <button onClick={() => update("dueTime", null)}>
                  <span className="text-text-tag text-lg leading-none">×</span>
                </button>
              )}
            </div>

            {/* Notif hint */}
            <div className="flex items-center gap-1.5 text-[12px] text-text-tag px-1">
              <Bell className="w-3 h-3" />
              <span>Day summary 8AM · Notif at time</span>
            </div>
          </div>
        </div>

        {/* Repeat */}
        <SelectField
          label="Repeat"
          value={form.repeat}
          options={[...REPEAT_OPTIONS]}
          onChange={val => update("repeat", val as Task["repeat"])}
        />

        {/* Task list */}
        <SelectField
          label="Task List"
          value={form.listId}
          options={listOptions}
          onChange={val => update("listId", val)}
          dotColor={selectedList?.color}
        />
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 pb-6 pt-2 bg-gradient-to-t from-layer-0 via-layer-0/90 to-transparent z-[80]">
        <button
          onClick={handleSave}
          disabled={!form.title.trim()}
          className={cn(
            "w-full py-4 rounded-card text-[15px] font-semibold text-white transition-all duration-200 shadow-fab",
            form.title.trim()
              ? "bg-brand active:scale-[0.98]"
              : "bg-layer-2 text-text-tag cursor-not-allowed"
          )}
        >
          {isNew ? "Add Task" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
