import type { Task } from "@/types";

export interface PositionedTask {
  task: Task;
  start: number;
  end: number;
  lane: number;
  laneCount: number;
}

export function positionTimelineTasks(tasks: Task[]): PositionedTask[] {
  const timed = tasks.filter((task) => task.startTime || task.dueTime).map((task) => {
    const start = minutes(task.startTime ?? task.dueTime, 0);
    return { task, start, end: Math.max(minutes(task.endTime, start + 60), start + 30) };
  }).filter(({ start }) => start < 1440).sort((a, b) => a.start - b.start);
  const groups: { end: number; items: typeof timed }[] = [];

  for (const item of timed) {
    const group = groups[groups.length - 1];
    if (!group || item.start >= group.end) groups.push({ end: item.end, items: [item] });
    else { group.items.push(item); group.end = Math.max(group.end, item.end); }
  }

  return groups.flatMap(({ items }) => {
    const lanes: number[] = [];
    const assigned = items.map((item) => {
      let lane = lanes.findIndex((end) => end <= item.start);
      if (lane < 0) lane = lanes.length;
      lanes[lane] = item.end;
      return { ...item, lane };
    });
    return assigned.map((item) => ({ ...item, laneCount: lanes.length }));
  });
}

function minutes(value: string | null | undefined, fallback: number) {
  if (!value) return fallback;
  const [hour, minute] = value.split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : fallback;
}
