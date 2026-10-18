"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import type { Task } from "@/types";
import { getInAppReminderKey, isInAppReminderDue } from "@/utils/inAppReminders";

interface InAppTaskRemindersProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
}

export function InAppTaskReminders({ tasks, onOpenTask }: InAppTaskRemindersProps) {
  const [reminders, setReminders] = useState<Task[]>([]);
  const notifiedKeys = useRef(new Set<string>());

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const activeTasks = tasks.filter((task) => isInAppReminderDue(task, now));

      for (const task of activeTasks) {
        const key = getInAppReminderKey(task);
        if (notifiedKeys.current.has(key)) continue;
        notifiedKeys.current.add(key);
        setReminders((current) => current.some((item) => getInAppReminderKey(item) === key)
          ? current
          : [...current, task]);
      }

      setReminders((current) => current.filter((reminder) =>
        tasks.some((task) =>
          getInAppReminderKey(task) === getInAppReminderKey(reminder) &&
          isInAppReminderDue(task, now),
        ),
      ));
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 10_000);
    return () => window.clearInterval(interval);
  }, [tasks]);

  if (reminders.length === 0) return null;

  return (
    <div
<<<<<<< HEAD
      className="pointer-events-none fixed inset-0 z-[250] flex flex-col items-center justify-center gap-2 p-4"
=======
      className="fixed right-4 top-4 z-[250] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
>>>>>>> 45d7f887b39200a875ea5181aa2f45005f59ddfd
      aria-label="Task reminders"
    >
      {reminders.map((task) => {
        const key = getInAppReminderKey(task);
        return (
          <section
            key={key}
            role="status"
<<<<<<< HEAD
            className="pointer-events-auto flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-xl p-4 shadow-dialog"
            style={{
              backgroundColor: "var(--color-primary)",
              border: "1px solid var(--color-accent)",
              boxShadow: "var(--shadow-dialog), 0 0 18px color-mix(in srgb, var(--color-primary) 45%, transparent)",
=======
            className="flex items-start gap-3 rounded-xl p-4 shadow-dialog"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-default)",
>>>>>>> 45d7f887b39200a875ea5181aa2f45005f59ddfd
            }}
          >
            <Bell
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
<<<<<<< HEAD
              style={{ color: "#ffffff" }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                Task starts in 2 minutes
              </p>
              <p className="mt-1 truncate text-sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
=======
              style={{ color: "var(--color-primary)" }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Task starts in 2 minutes
              </p>
              <p className="mt-1 truncate text-sm" style={{ color: "var(--color-text-secondary)" }}>
>>>>>>> 45d7f887b39200a875ea5181aa2f45005f59ddfd
                {task.title}
              </p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
<<<<<<< HEAD
                style={{ color: "#ffffff" }}
=======
                style={{ color: "var(--color-primary)" }}
>>>>>>> 45d7f887b39200a875ea5181aa2f45005f59ddfd
                onClick={() => onOpenTask(task)}
              >
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
                View task
              </button>
            </div>
            <button
              type="button"
              aria-label={`Dismiss reminder for ${task.title}`}
              className="shrink-0 rounded p-1"
<<<<<<< HEAD
              style={{ color: "rgba(255, 255, 255, 0.85)" }}
=======
              style={{ color: "var(--color-text-hint)" }}
>>>>>>> 45d7f887b39200a875ea5181aa2f45005f59ddfd
              onClick={() => setReminders((current) => current.filter((item) => getInAppReminderKey(item) !== key))}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </section>
        );
      })}
    </div>
  );
}
