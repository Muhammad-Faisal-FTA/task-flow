"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/types";
import { formatTimerDuration, getTaskTimerState } from "@/utils/taskTimer";

export function TaskTimerLabel({ task }: { task: Task }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const update = () => setNow(new Date());
    const interval = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
    };
  }, []);

  const timer = task.completed ? null : getTaskTimerState(task, now);
  if (!timer?.started || !task.durationMinutes) return null;

  return (
    <span className="mt-1 block truncate font-semibold" style={{ fontSize: "var(--text-xs)", color: timer.complete ? "#fca5a5" : "#bbf7d0" }}>
      {timer.complete ? "Timer complete" : `Time left ${formatTimerDuration(timer.remainingMs)}`}
    </span>
  );
}
