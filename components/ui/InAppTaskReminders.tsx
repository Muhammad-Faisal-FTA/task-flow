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
      className="fixed right-4 top-4 z-[250] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      aria-label="Task reminders"
    >
      {reminders.map((task) => {
        const key = getInAppReminderKey(task);
        return (
          <section
            key={key}
            role="status"
            className="flex items-start gap-3 rounded-xl p-4 shadow-dialog"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-default)",
            }}
          >
            <Bell
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: "var(--color-primary)" }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Task starts in 2 minutes
              </p>
              <p className="mt-1 truncate text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {task.title}
              </p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--color-primary)" }}
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
              style={{ color: "var(--color-text-hint)" }}
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
