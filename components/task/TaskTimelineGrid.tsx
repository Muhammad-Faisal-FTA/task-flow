"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { TaskCheckbox } from "@/components/task/TaskCheckbox";
import { TaskTimerLabel } from "@/components/task/TaskTimerLabel";
import type { Task } from "@/types";
import type { PositionedTask } from "@/utils/positionTimelineTasks";

interface Props {
  tasks: PositionedTask[];
  startHour: number;
  endHour: number;
  height: number;
  initialScrollHour: number;
  currentMinute: number;
  showCurrentTime: boolean;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onTaskClick: (task: Task) => void;
  onToggle: (taskId: string) => Promise<void>;
  isToggling: (taskId: string) => boolean;
}

const HOUR_HEIGHT = 64;

function hourLabel(hour: number) {
  return `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
}

function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function currentTimeLabel(minuteOfDay: number) {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = Math.floor(minuteOfDay % 60);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function getScrollViewportHeight(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return parent.clientHeight;
    parent = parent.parentElement;
  }
  return window.innerHeight;
}

export function TaskTimelineGrid({ tasks, startHour, endHour, height, initialScrollHour, currentMinute, showCurrentTime, onClick, onKeyDown, onTaskClick, onToggle, isToggling }: Props) {
  const currentHourRef = useRef<HTMLDivElement>(null);
  const didAutoScroll = useRef(false);
  const [scrollTail, setScrollTail] = useState<number | null>(null);

  useEffect(() => {
    if (!currentHourRef.current) return;
    const updateTailSpace = () => {
      const viewportHeight = getScrollViewportHeight(currentHourRef.current!);
      setScrollTail(Math.max(0, viewportHeight - (endHour - initialScrollHour) * HOUR_HEIGHT));
    };
    updateTailSpace();
    window.addEventListener("resize", updateTailSpace);
    return () => window.removeEventListener("resize", updateTailSpace);
  }, [endHour, initialScrollHour]);

  useEffect(() => {
    if (!currentHourRef.current || scrollTail === null || didAutoScroll.current) return;
    currentHourRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    didAutoScroll.current = true;
  }, [initialScrollHour, scrollTail]);

  return (
    <>
      <div className="flex" style={{ backgroundColor: "var(--color-bg-app)" }}>
        <div className="w-12 flex-shrink-0 sm:w-14" style={{ height }}>
          {Array.from({ length: endHour - startHour }, (_, index) => (
            <div ref={startHour + index === initialScrollHour ? currentHourRef : undefined} key={index} className="flex items-start justify-end pr-2" style={{ height: HOUR_HEIGHT, color: "var(--color-text-hint)", fontSize: "var(--text-xs)" }}>
              {hourLabel(startHour + index)}
            </div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height, padding: "0 4px" }} onClick={onClick} role="button" tabIndex={0} aria-label="Click a time to add a task" onKeyDown={onKeyDown}>
          <span className="pointer-events-none absolute left-2 top-2 z-[1] rounded px-1.5 py-1" style={{ backgroundColor: "var(--color-bg-card)", color: "var(--color-text-hint)", fontSize: "var(--text-xs)" }}>Click a time to add a task</span>
          {Array.from({ length: endHour - startHour + 1 }, (_, index) => (
            <div key={index} className="absolute inset-x-0 border-t" style={{ top: index * HOUR_HEIGHT, borderColor: "var(--color-border-default)" }} />
          ))}
          {showCurrentTime && currentMinute >= startHour * 60 && currentMinute < endHour * 60 && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-[3] flex items-center" style={{ top: (currentMinute - startHour * 60) * (HOUR_HEIGHT / 60) }}>
              <span className="absolute left-0 z-[1] translate-y-1/2 rounded-full px-1.5 py-0.5 font-semibold" style={{ backgroundColor: "var(--color-bg-card)", color: "var(--color-primary)", fontSize: 10 }}>
                {currentTimeLabel(currentMinute)}
              </span>
              <span className="h-0.5 w-full" style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 0 6px var(--color-primary)" }} />
              <span className="absolute left-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--color-bg-app)" }} />
            </div>
          )}
          {tasks.map(({ task, start, end, lane, laneCount }) => {
            if (end <= startHour * 60 || start >= endHour * 60) return null;
            const top = Math.max(0, (start - startHour * 60) * (HOUR_HEIGHT / 60));
            const blockHeight = Math.min(height - top, Math.max(30, end - start) * (HOUR_HEIGHT / 60));
            const gap = 4;
            return (
              <div key={task.id} onClick={(event) => { event.stopPropagation(); onTaskClick(task); }} className="absolute flex gap-2 overflow-hidden rounded-[8px] px-2 py-1 text-left shadow-card transition-transform active:scale-[0.98]" style={{ top, height: blockHeight, left: `calc(${(lane * 100) / laneCount}% + ${gap / 2}px)`, width: `calc(${100 / laneCount}% - ${gap}px)`, zIndex: 2, backgroundColor: task.completed ? "color-mix(in srgb, var(--color-primary) 35%, var(--color-bg-card))" : "var(--color-primary)", color: "var(--color-text-primary)", opacity: task.completed ? 0.72 : 1 }}>
                <TaskCheckbox taskId={task.id} completed={task.completed} onToggle={onToggle} isToggling={isToggling(task.id)} />
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-semibold" style={{ fontSize: "var(--text-sm)", textDecoration: task.completed ? "line-through" : "none", opacity: task.completed ? 0.6 : 1 }}>{task.title}</span>
                  <span className="block truncate" style={{ fontSize: "var(--text-xs)", opacity: 0.8 }}>{timeLabel(task.startTime ?? task.dueTime!)}{task.endTime ? ` - ${timeLabel(task.endTime)}` : " - 1 hr"}</span>
                  <TaskTimerLabel task={task} />
                  <span className="mt-1 inline-block rounded px-1 font-semibold" style={{ fontSize: 10, backgroundColor: "rgba(255,255,255,0.2)" }}>{task.priority ?? "C"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Keep late hours alignable through the app's normal content scroller. */}
      <div aria-hidden="true" style={{ height: scrollTail ?? 0 }} />
    </>
  );
}
