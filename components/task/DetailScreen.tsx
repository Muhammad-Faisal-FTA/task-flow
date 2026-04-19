// "use client";
// import { useState, useEffect } from "react";
// import { Trash2, Bell } from "lucide-react";
// import { HeaderBar } from "@/components/layout/HeaderBar";
// import { Checkbox } from "@/components/ui/Checkbox";
// import { SelectField } from "@/components/ui/SelectField";
// import { cn } from "@/lib/cn";
// import { REPEAT_OPTIONS } from "@/lib/data";
// import type { Task, TaskList, Screen } from "@/types";

// // Flexible interface that works with both useAppState and useAuthenticatedApp
// interface DetailScreenState {
//   selectedTask: Task | null;
//   saveTask: (task: Omit<Task, "id" | "status" | "hasRepeatIcon"> & { id?: string }) => boolean | Promise<boolean>;
//   deleteTask: (id: string) => void;
//   goBack: () => void;
//   lists: TaskList[];
// }

// interface DetailScreenProps {
//   state: DetailScreenState;
// }

// export function DetailScreen({ state }: DetailScreenProps) {
//   const { selectedTask, saveTask, deleteTask, goBack, lists } = state;
//   const [form, setForm] = useState<Task | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   useEffect(() => {
//     if (selectedTask) setForm({ ...selectedTask });
//   }, [selectedTask]);

//   if (!form) return null;

//   const isNew = !form.id;
//   const listOptions = lists.map(l => ({ value: l.id, label: l.name }));
//   const selectedList = lists.find(l => l.id === form.listId);

//   const update = <K extends keyof Task>(key: K, val: Task[K]) =>
//     setForm(prev => prev ? { ...prev, [key]: val } : prev);

//   const handleSave = async () => {
//     if (!form || !form.title.trim()) return;
//     setIsSaving(true);
//     try {
//       await saveTask({
//         id: form.id || undefined,
//         title: form.title,
//         listId: form.listId,
//         completed: form.completed,
//         dueDate: form.dueDate,
//         dueTime: form.dueTime,
//         repeat: form.repeat,
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const inputCls =
//     "w-full bg-layer-2 border border-layer-3/40 rounded-input px-4 py-3 text-[14px] text-text-primary placeholder:text-text-placeholder outline-none focus:border-brand-accent transition-colors";
//   const labelCls =
//     "block text-[11px] font-semibold tracking-widest uppercase text-brand-accent mb-2";

//   return (
//     <div className="flex flex-col h-full">
//       <HeaderBar
//         title={isNew ? "New Task" : "Edit Task"}
//         showBack
//         onBack={goBack}
//         rightAction={
//           !isNew && (
//             <button
//               onClick={() => form.id && deleteTask(form.id)}
//               className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-layer-2 active:bg-status-overdue/20 transition-colors"
//             >
//               <Trash2 className="w-4 h-4 text-text-tag" />
//             </button>
//           )
//         }
//       />

//       <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28 space-y-5 scrollbar-none">

//         {/* Task title */}
//         <div>
//           <label className={labelCls}>What is to be done?</label>
//           <textarea
//             value={form.title}
//             onChange={e => update("title", e.target.value)}
//             placeholder="Task name…"
//             rows={2}
//             className={cn(inputCls, "resize-none leading-relaxed")}
//           />
//         </div>

//         {/* Finished toggle */}
//         <div
//           className="flex items-center gap-3 bg-layer-2 border border-layer-3/40 rounded-input px-4 py-3 cursor-pointer"
//           onClick={() => update("completed", !form.completed)}
//         >
//           <Checkbox checked={form.completed} onChange={() => update("completed", !form.completed)} />
//           <span className="text-[14px] text-text-date">Task finished?</span>
//         </div>

//         {/* Due date */}
//         <div>
//           <label className={labelCls}>Due Date</label>
//           <div className="space-y-2">
//             {/* Date picker row */}
//             <div className="flex items-center gap-2 bg-layer-2 border border-layer-3/40 rounded-input px-4 py-3">
//               <input
//                 type="date"
//                 value={form.dueDate ?? ""}
//                 onChange={e => update("dueDate", e.target.value || null)}
//                 className="flex-1 bg-transparent text-[14px] text-text-primary outline-none [color-scheme:dark]"
//               />
//             </div>

//             {/* Time picker row */}
//             <div
//               className={cn(
//                 "flex items-center gap-2 bg-layer-2 border rounded-input px-4 py-3",
//                 form.dueTime ? "border-status-overdue/50" : "border-layer-3/40"
//               )}
//             >
//               <input
//                 type="time"
//                 value={form.dueTime ?? ""}
//                 onChange={e => update("dueTime", e.target.value || null)}
//                 placeholder="No time"
//                 className={cn(
//                   "flex-1 bg-transparent text-[14px] outline-none [color-scheme:dark]",
//                   form.dueTime ? "text-status-overdue font-semibold" : "text-text-placeholder"
//                 )}
//               />
//               {form.dueTime && (
//                 <button onClick={() => update("dueTime", null)}>
//                   <span className="text-text-tag text-lg leading-none">×</span>
//                 </button>
//               )}
//             </div>

//             {/* Notif hint */}
//             <div className="flex items-center gap-1.5 text-[12px] text-text-tag px-1">
//               <Bell className="w-3 h-3" />
//               <span>Day summary 8AM · Notif at time</span>
//             </div>
//           </div>
//         </div>

//         {/* Repeat */}
//         <SelectField
//           label="Repeat"
//           value={form.repeat}
//           options={[...REPEAT_OPTIONS]}
//           onChange={val => update("repeat", val as Task["repeat"])}
//         />

//         {/* Task list */}
//         <SelectField
//           label="Task List"
//           value={form.listId}
//           options={listOptions}
//           onChange={val => update("listId", val)}
//           dotColor={selectedList?.color}
//         />
//       </div>

//       {/* Save button */}
//       <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 pb-6 pt-2 bg-gradient-to-t from-layer-0 via-layer-0/90 to-transparent z-[80]">
//         <button
//           onClick={handleSave}
//           disabled={!form.title.trim()}
//           className={cn(
//             "w-full py-4 rounded-card text-[15px] font-semibold text-white transition-all duration-200 shadow-fab",
//             form.title.trim()
//               ? "bg-brand active:scale-[0.98]"
//               : "bg-layer-2 text-text-tag cursor-not-allowed"
//           )}
//         >
//           {isNew ? "Add Task" : "Save Changes"}
//         </button>
//       </div>
//     </div>
//   );
// }





// components/task/DetailScreen.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trash2, Bell, Calendar, Clock,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { HeaderBar }   from "@/components/layout/HeaderBar";
import { Checkbox }    from "@/components/ui/Checkbox";
import { SelectField } from "@/components/ui/SelectField";
import { DatePicker }  from "@/components/ui/DatePicker";
import { TimePicker }  from "@/components/ui/TimePicker";
import { cn }          from "@/lib/cn";
import { REPEAT_OPTIONS } from "@/lib/data";
import type { Task, TaskList, Screen } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DetailScreenState {
  selectedTask: Task | null;
  saveTask:     (task: Omit<Task, "id" | "status" | "hasRepeatIcon"> & { id?: string }) => boolean | Promise<boolean>;
  deleteTask:   (id: string) => void;
  goBack:       () => void;
  lists:        TaskList[];
}

interface DetailScreenProps {
  state: DetailScreenState;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDisplayDate(iso: string | null): string {
  if (!iso) return "No date";
  const d = new Date(iso + "T00:00:00");
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth()    === today.getMonth()    &&
    d.getDate()     === today.getDate()
  ) return "Today";

  if (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth()    === tomorrow.getMonth()    &&
    d.getDate()     === tomorrow.getDate()
  ) return "Tomorrow";

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
  });
}

function formatDisplayTime(time: string | null): string {
  if (!time) return "No time";
  const [h, m] = time.split(":").map(Number);
  const ampm   = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DetailScreen({ state }: DetailScreenProps) {
  const { selectedTask, saveTask, deleteTask, goBack, lists } = state;

  const [form,     setForm]     = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Which picker is open — only one at a time
  const [openPicker, setOpenPicker] = useState<"date" | "time" | null>(null);

  useEffect(() => {
    if (selectedTask) {
      setForm({ ...selectedTask });
      setOpenPicker(null);
    }
  }, [selectedTask]);

  if (!form) return null;

  const isNew        = !form.id;
  const listOptions  = lists.map(l => ({ value: l.id, label: l.name }));
  const selectedList = lists.find(l => l.id === form.listId);

  const update = <K extends keyof Task>(key: K, val: Task[K]) =>
    setForm(prev => prev ? { ...prev, [key]: val } : prev);

  const togglePicker = (picker: "date" | "time") =>
    setOpenPicker(prev => prev === picker ? null : picker);

  const handleSave = async () => {
    if (!form?.title.trim()) return;
    setIsSaving(true);
    try {
      await saveTask({
        id:        form.id || undefined,
        title:     form.title,
        listId:    form.listId,
        completed: form.completed,
        dueDate:   form.dueDate,
        dueTime:   form.dueTime,
        repeat:    form.repeat,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────
  const labelCls = "block font-semibold tracking-widest uppercase mb-2";
  const rowCls   = "flex items-center justify-between rounded-card px-4 py-3 cursor-pointer transition-all duration-200 active:scale-[0.99]";

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <HeaderBar
        title={isNew ? "New Task" : "Edit Task"}
        showBack
        onBack={goBack}
        rightAction={
          !isNew && (
            <button
              onClick={() => form.id && deleteTask(form.id)}
              className="w-9 h-9 flex items-center justify-center rounded-[8px] active:scale-90 transition-transform"
              style={{ backgroundColor: "var(--color-bg-card)" }}
            >
              <Trash2
                className="w-4 h-4"
                style={{ color: "var(--color-text-hint)" }}
              />
            </button>
          )
        }
      />

      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ padding: "20px 16px 120px" }}
      >
        {/* ── Task title ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: "20px" }}>
          <label
            className={labelCls}
            style={{
              fontSize: "var(--text-xs)",
              color:    "var(--color-text-accent)",
            }}
          >
            What is to be done?
          </label>
          <textarea
            value={form.title}
            onChange={e => update("title", e.target.value)}
            placeholder="Task name…"
            rows={2}
            className="auth-input resize-none leading-relaxed w-full"
          />
        </div>

        {/* ── Completed toggle ─────────────────────────────────────────── */}
        <div
          className={rowCls}
          onClick={() => update("completed", !form.completed)}
          style={{
            marginBottom:    "20px",
            backgroundColor: "var(--color-bg-card)",
            border:          "1px solid var(--color-border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={form.completed}
              onChange={() => update("completed", !form.completed)}
            />
            <span style={{
              fontSize: "var(--text-base)",
              color:    "var(--color-text-secondary)",
            }}>
              Task finished?
            </span>
          </div>
          {form.completed && (
            <span style={{
              fontSize:        "var(--text-xs)",
              color:           "var(--color-success)",
              backgroundColor: "rgba(67,160,71,0.1)",
              padding:         "3px 8px",
              borderRadius:    "var(--radius-btn)",
              fontWeight:      600,
            }}>
              Done ✓
            </span>
          )}
        </div>

        {/* ── Due date ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "12px" }}>
          <label
            className={labelCls}
            style={{
              fontSize: "var(--text-xs)",
              color:    "var(--color-text-accent)",
            }}
          >
            Due Date
          </label>

          {/* Date trigger row */}
          <div
            className={rowCls}
            onClick={() => togglePicker("date")}
            style={{
              backgroundColor: "var(--color-bg-card)",
              border:          `1.5px solid ${
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
                  width:  "16px",
                  height: "16px",
                  color:  form.dueDate
                    ? "var(--color-primary)"
                    : "var(--color-text-hint)",
                }}
              />
              <span
                style={{
                  fontSize:   "var(--text-base)",
                  fontWeight: form.dueDate ? 600 : 400,
                  color:      form.dueDate
                    ? "var(--color-text-primary)"
                    : "var(--color-text-hint)",
                }}
              >
                {formatDisplayDate(form.dueDate)}
              </span>
            </div>
            {openPicker === "date"
              ? <ChevronUp   style={{ width: "16px", height: "16px", color: "var(--color-text-hint)" }} />
              : <ChevronDown style={{ width: "16px", height: "16px", color: "var(--color-text-hint)" }} />
            }
          </div>

          {/* Date picker — expands inline */}
          {openPicker === "date" && (
            <div style={{ marginBottom: "8px" }}>
              <DatePicker
                value={form.dueDate}
                onChange={val => {
                  update("dueDate", val);
                  if (val) setOpenPicker(null);
                }}
                onClose={() => setOpenPicker(null)}
              />
            </div>
          )}

          {/* Time trigger row — only shown when date is set */}
          {form.dueDate && (
            <>
              <div
                className={rowCls}
                onClick={() => togglePicker("time")}
                style={{
                  backgroundColor: "var(--color-bg-card)",
                  border:          `1.5px solid ${
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
                      width:  "16px",
                      height: "16px",
                      color:  form.dueTime
                        ? "var(--color-overdue)"
                        : "var(--color-text-hint)",
                    }}
                  />
                  <span
                    style={{
                      fontSize:   "var(--text-base)",
                      fontWeight: form.dueTime ? 600 : 400,
                      color:      form.dueTime
                        ? "var(--color-overdue)"
                        : "var(--color-text-hint)",
                    }}
                  >
                    {formatDisplayTime(form.dueTime)}
                  </span>
                </div>
                {openPicker === "time"
                  ? <ChevronUp   style={{ width: "16px", height: "16px", color: "var(--color-text-hint)" }} />
                  : <ChevronDown style={{ width: "16px", height: "16px", color: "var(--color-text-hint)" }} />
                }
              </div>

              {/* Time picker — expands inline */}
              {openPicker === "time" && (
                <div style={{ marginBottom: "8px" }}>
                  <TimePicker
                    value={form.dueTime}
                    onChange={val => update("dueTime", val)}
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
              color:    "var(--color-text-hint)",
            }}
          >
            <Bell style={{ width: "12px", height: "12px" }} />
            <span>Day summary 8AM · Notif at time</span>
          </div>
        </div>

        {/* ── Repeat ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "20px" }}>
          <SelectField
            label="Repeat"
            value={form.repeat}
            options={[...REPEAT_OPTIONS]}
            onChange={val => update("repeat", val as Task["repeat"])}
          />
        </div>

        {/* ── Task list ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "20px" }}>
          <SelectField
            label="Task List"
            value={form.listId}
            options={listOptions}
            onChange={val => update("listId", val)}
            dotColor={selectedList?.color}
          />
        </div>
      </div>

      {/* ── Save button ───────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 pb-6 pt-3 z-[80]"
        style={{
          background: "linear-gradient(to top, var(--color-bg-app) 70%, transparent)",
        }}
      >
        <button
          onClick={handleSave}
          disabled={!form.title.trim() || isSaving}
          className="w-full py-4 rounded-card font-semibold transition-all duration-200 active:scale-[0.98]"
          style={{
            fontSize:        "var(--text-md)",
            color:           "#ffffff",
            backgroundColor: form.title.trim() && !isSaving
              ? "var(--color-primary)"
              : "var(--color-bg-card)",
            cursor:          !form.title.trim() || isSaving
              ? "not-allowed"
              : "pointer",
            opacity:         !form.title.trim() || isSaving ? 0.6 : 1,
            boxShadow:       "var(--shadow-fab)",
          }}
        >
          {isSaving
            ? "Saving…"
            : isNew
            ? "Add Task"
            : "Save Changes"
          }
        </button>
      </div>
    </div>
  );
}