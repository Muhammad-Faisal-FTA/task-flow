"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Volume2, VolumeX, X } from "lucide-react";
import type { Task } from "@/types";
import { getInAppReminderKey, isInAppReminderDue } from "@/utils/inAppReminders";

interface InAppTaskRemindersProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
}

export function InAppTaskReminders({ tasks, onOpenTask }: InAppTaskRemindersProps) {
  const [reminders, setReminders] = useState<Task[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const notifiedKeys = useRef(new Set<string>());
  const audioContext = useRef<AudioContext | null>(null);
  const soundReady = useRef(false);

  useEffect(() => {
    const enabled = window.localStorage.getItem("taskflow-reminder-sound") === "on";
    soundReady.current = true;
    setSoundEnabled(enabled);
  }, []);

  const playReminderTone = () => {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    const context = audioContext.current ?? new AudioContextConstructor();
    audioContext.current = context;
    void context.resume().then(() => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.5);
    }).catch(() => undefined);
  };

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const activeTasks = tasks.filter((task) => isInAppReminderDue(task, now));

      for (const task of activeTasks) {
        const key = getInAppReminderKey(task);
        if (notifiedKeys.current.has(key)) continue;
        notifiedKeys.current.add(key);
        if (soundEnabled) playReminderTone();
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
  }, [tasks, soundEnabled]);

  if (reminders.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[250] flex flex-col items-center justify-center gap-2 p-4"
      aria-label="Task reminders"
    >
      <button
        type="button"
        aria-pressed={soundEnabled}
        onClick={() => {
          const enabled = !soundEnabled;
          setSoundEnabled(enabled);
          window.localStorage.setItem("taskflow-reminder-sound", enabled ? "on" : "off");
          if (enabled) {
            soundReady.current = true;
            playReminderTone();
          }
        }}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-card"
        style={{ backgroundColor: "var(--color-bg-card)", color: "var(--color-text-primary)" }}
      >
        {soundEnabled ? <Volume2 aria-hidden="true" className="h-4 w-4" /> : <VolumeX aria-hidden="true" className="h-4 w-4" />}
        Sound {soundEnabled ? "on" : "off"}
      </button>
      {reminders.map((task) => {
        const key = getInAppReminderKey(task);
        return (
          <section
            key={key}
            role="status"
            className="pointer-events-auto flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-xl p-4 shadow-dialog"
            style={{
              backgroundColor: "var(--color-primary)",
              border: "1px solid var(--color-accent)",
              boxShadow: "var(--shadow-dialog), 0 0 18px color-mix(in srgb, var(--color-primary) 45%, transparent)",
            }}
          >
            <Bell
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: "#ffffff" }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                Task starts in 2 minutes
              </p>
              <p className="mt-1 truncate text-sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                {task.title}
              </p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "#ffffff" }}
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
              style={{ color: "rgba(255, 255, 255, 0.85)" }}
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
