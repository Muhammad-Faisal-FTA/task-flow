// services/cdfService.ts

import mongoose from "mongoose";
import { connectDB }       from "@/lib/mongoose";
import { CdfSettingsModel } from "@/models/cdfSettings.model";
import { CdfEventModel }    from "@/models/cdfEvent.model";
import { CdfScoreModel }    from "@/models/cdfScore.model";
import {
  getGrade,
  type CdfSettingsDTO,
  type CdfEventDTO,
  type CdfScoreDTO,
  type CdfEventGroup,
  type CreateCdfEventInput,
  type SubmitFocusInput,
  type ICdfEvent,
  type ICdfScore,
} from "@/types/cdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("INVALID_ID");
  return new mongoose.Types.ObjectId(id);
}

function getWindowStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Serialisers ──────────────────────────────────────────────────────────────

function serialiseEvent(doc: ICdfEvent): CdfEventDTO {
  return {
    id:             doc._id.toString(),
    taskId:         doc.taskId.toString(),
    taskTitle:      doc.taskTitle,
    listId:         doc.listId.toString(),
    repeat:         doc.repeat,
    dueDate:        doc.dueDate ? doc.dueDate.toISOString() : null,
    dueTime:        doc.dueTime ?? null,
    completedAt:    doc.completedAt.toISOString(),
    onTime:         doc.onTime,
    lateByMs:       doc.lateByMs,
    focusScore:     doc.focusScore ?? null,
    focusEnteredAt: doc.focusEnteredAt
      ? doc.focusEnteredAt.toISOString()
      : null,
    createdAt:      doc.createdAt.toISOString(),
  };
}

function serialiseScore(doc: ICdfScore): CdfScoreDTO {
  const overallScore = Math.round(
    doc.consistencyScore * 0.4 +
    doc.disciplineScore  * 0.35 +
    doc.focusScore       * 0.25
  );

  return {
    // Consistency
    consistencyScore:  Math.round(doc.consistencyScore),
    consistencyStreak: doc.consistencyStreak,
    longestStreak:     doc.longestStreak,
    totalExpected:     doc.totalExpected,
    totalCompleted:    doc.totalCompleted,

    // Discipline
    disciplineScore:  Math.round(doc.disciplineScore),
    onTimeCount:      doc.onTimeCount,
    totalTimedTasks:  doc.totalTimedTasks,

    // Focus
    focusScore:   Math.round(doc.focusScore),
    focusEntries: doc.focusEntries,

    // Meta
    windowStart:       doc.windowStart.toISOString(),
    windowEnd:         doc.windowEnd.toISOString(),
    lastCalculatedAt:  doc.lastCalculatedAt.toISOString(),

    // Grades
    consistencyGrade: getGrade(doc.consistencyScore),
    disciplineGrade:  getGrade(doc.disciplineScore),
    focusGrade:       getGrade(doc.focusScore),
    overallScore,
  };
}

// ─── onTime calculation ───────────────────────────────────────────────────────
// Returns { onTime, lateByMs }
// Buffer: 60 seconds — completing at 7:00:59 is still "on time"
function calculateOnTime(
  dueDate: string | null,
  dueTime: string | null,
  completedAt: Date
): { onTime: boolean; lateByMs: number } {
  if (!dueDate || !dueTime) {
    // No due time set — cannot measure discipline
    return { onTime: true, lateByMs: 0 };
  }

  const [h, m]   = dueTime.split(":").map(Number);
  const deadline = new Date(dueDate);
  deadline.setHours(h, m, 0, 0);

  // Add 60 second buffer
  const deadlineWithBuffer = new Date(deadline.getTime() + 60 * 1000);
  const lateByMs = Math.max(
    0,
    completedAt.getTime() - deadlineWithBuffer.getTime()
  );

  return {
    onTime:   completedAt <= deadlineWithBuffer,
    lateByMs,
  };
}

// ─── Streak calculation ───────────────────────────────────────────────────────
// Counts consecutive days (ending today) where ≥1 repeat task was completed
async function calculateStreak(
  userId: mongoose.Types.ObjectId,
  windowStart: Date
): Promise<{ current: number; longest: number }> {

  // Get all repeat events in window, grouped by date
  const events = await CdfEventModel
    .find({
      userId,
      repeat:      { $ne: "none" },
      completedAt: { $gte: windowStart },
    })
    .select("completedAt")
    .sort({ completedAt: -1 })
    .lean();

  if (events.length === 0) return { current: 0, longest: 0 };

  // Build set of unique dates (YYYY-MM-DD) that had completions
  const completedDates = new Set(
    events.map(e =>
      e.completedAt.toISOString().split("T")[0]
    )
  );

  // Count current streak — consecutive days ending today
  let current = 0;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];

    if (completedDates.has(key)) {
      current++;
    } else {
      break;
    }
  }

  // Longest streak — sliding window
  const sortedDates = Array.from(completedDates).sort();
  let longest = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  longest = Math.max(longest, current, 1);

  return { current, longest };
}

// ─── Score recalculation ──────────────────────────────────────────────────────
// Called after every CDF event — recalculates all scores in window
async function recalculateScores(
  userId: mongoose.Types.ObjectId
): Promise<void> {
  const windowStart = getWindowStart();
  const windowEnd   = new Date();

  // Fetch all events in rolling 30-day window
  const events = await CdfEventModel
    .find({
      userId,
      completedAt: { $gte: windowStart },
    })
    .lean();

  // ── Consistency ─────────────────────────────────────────────────────────
  const repeatEvents = events.filter(e => e.repeat !== "none");

  // Estimate expected completions in window
  // Daily: 30, Weekdays: ~22, Weekly: ~4, Monthly: 1, Yearly: 0
  const EXPECTED_PER_30_DAYS: Record<string, number> = {
    daily:    30,
    weekdays: 22,
    weekly:   4,
    monthly:  1,
    yearly:   0,
    none:     0,
  };

  // Count unique tasks tracked
  const uniqueRepeatTasks = new Set(
    repeatEvents.map(e => e.taskId.toString())
  );

  let totalExpected = 0;
  for (const taskId of uniqueRepeatTasks) {
    const taskEvents = repeatEvents.filter(
      e => e.taskId.toString() === taskId
    );
    const repeat = taskEvents[0]?.repeat ?? "none";
    totalExpected += EXPECTED_PER_30_DAYS[repeat] ?? 0;
  }

  const totalCompleted     = repeatEvents.length;
  const consistencyScore   = totalExpected > 0
    ? Math.min(100, (totalCompleted / totalExpected) * 100)
    : 0;

  // ── Discipline ───────────────────────────────────────────────────────────
  const timedEvents     = events.filter(e => e.dueTime !== null);
  const totalTimedTasks = timedEvents.length;
  const onTimeCount     = timedEvents.filter(e => e.onTime).length;
  const disciplineScore = totalTimedTasks > 0
    ? (onTimeCount / totalTimedTasks) * 100
    : 0;

  // ── Focus ────────────────────────────────────────────────────────────────
  const focusEvents  = events.filter(e => e.focusScore !== null);
  const focusEntries = focusEvents.length;
  const focusTotal   = focusEvents.reduce(
    (sum, e) => sum + (e.focusScore ?? 0), 0
  );
  const focusScore   = focusEntries > 0
    ? focusTotal / focusEntries
    : 0;

  // ── Streak ───────────────────────────────────────────────────────────────
  const { current: consistencyStreak, longest: longestStreak } =
    await calculateStreak(userId, windowStart);

  // ── Upsert score doc ─────────────────────────────────────────────────────
  await CdfScoreModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        consistencyScore,
        consistencyStreak,
        longestStreak,
        totalExpected,
        totalCompleted,
        disciplineScore,
        onTimeCount,
        totalTimedTasks,
        focusScore,
        focusEntries,
        focusTotal,
        windowStart,
        windowEnd,
        lastCalculatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC SERVICE FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getCdfSettings(
  userId: string
): Promise<CdfSettingsDTO> {
  await connectDB();

  const settings = await CdfSettingsModel.findOne({
    userId: toObjectId(userId),
  }).lean();

  // Default: CDF disabled
  if (!settings) {
    return {
      enabled:   false,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    enabled:   settings.enabled,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function updateCdfSettings(
  userId: string,
  enabled: boolean
): Promise<CdfSettingsDTO> {
  await connectDB();

  const settings = await CdfSettingsModel.findOneAndUpdate(
    { userId: toObjectId(userId) },
    { $set: { enabled } },
    { upsert: true, new: true }
  );

  return {
    enabled:   settings.enabled,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

// ─── Check if CDF enabled ─────────────────────────────────────────────────────
export async function isCdfEnabled(userId: string): Promise<boolean> {
  await connectDB();
  const settings = await CdfSettingsModel.findOne({
    userId: toObjectId(userId),
  }).lean();
  return settings?.enabled ?? false;
}

// ─── Create CDF event ─────────────────────────────────────────────────────────
export async function createCdfEvent(
  userId: string,
  input:  CreateCdfEventInput
): Promise<CdfEventDTO> {
  await connectDB();

  const completedAt = new Date();
  const { onTime, lateByMs } = calculateOnTime(
    input.dueDate,
    input.dueTime,
    completedAt
  );

  const event = await CdfEventModel.create({
    userId:      toObjectId(userId),
    taskId:      toObjectId(input.taskId),
    taskTitle:   input.taskTitle,
    listId:      toObjectId(input.listId),
    repeat:      input.repeat,
    dueDate:     input.dueDate ? new Date(input.dueDate) : null,
    dueTime:     input.dueTime ?? null,
    completedAt,
    onTime,
    lateByMs,
    focusScore:     null,
    focusEnteredAt: null,
  });

  // Recalculate scores asynchronously — don't block response
  recalculateScores(toObjectId(userId)).catch(err =>
    console.error("[CDF] Score recalculation failed:", err)
  );

  return serialiseEvent(event);
}

// ─── Submit focus score ───────────────────────────────────────────────────────
export async function submitFocusScore(
  userId:  string,
  eventId: string,
  input:   SubmitFocusInput
): Promise<CdfEventDTO> {
  await connectDB();

  if (input.focusScore < 0 || input.focusScore > 100) {
    throw new Error("INVALID_FOCUS_SCORE");
  }

  const event = await CdfEventModel.findOneAndUpdate(
    {
      _id:    toObjectId(eventId),
      userId: toObjectId(userId),      // ownership check
    },
    {
      $set: {
        focusScore:     Math.round(input.focusScore),
        focusEnteredAt: new Date(),
      },
    },
    { new: true }
  );

  if (!event) throw new Error("EVENT_NOT_FOUND");

  // Recalculate scores asynchronously
  recalculateScores(toObjectId(userId)).catch(err =>
    console.error("[CDF] Score recalculation failed:", err)
  );

  return serialiseEvent(event);
}

// ─── Get scores ───────────────────────────────────────────────────────────────
export async function getCdfScores(
  userId: string
): Promise<CdfScoreDTO | null> {
  await connectDB();

  const score = await CdfScoreModel.findOne({
    userId: toObjectId(userId),
  }).lean();

  if (!score) return null;
  return serialiseScore(score as unknown as ICdfScore);
}

// ─── Get events (grouped by date) ────────────────────────────────────────────
export async function getCdfEvents(
  userId: string,
  limit = 50
): Promise<CdfEventGroup[]> {
  await connectDB();

  const windowStart = getWindowStart();

  const events = await CdfEventModel
    .find({
      userId:      toObjectId(userId),
      completedAt: { $gte: windowStart },
    })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();

  const dtos = events.map(e => serialiseEvent(e as unknown as ICdfEvent));

  // Group by date label
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const last7     = new Date(today);
  last7.setDate(today.getDate() - 7);

  const groups: CdfEventGroup[] = [
    { label: "Today",       events: [] },
    { label: "Yesterday",   events: [] },
    { label: "Last 7 Days", events: [] },
    { label: "Older",       events: [] },
  ];

  for (const dto of dtos) {
    const completedDate = new Date(dto.completedAt);
    const dateOnly      = new Date(
      completedDate.getFullYear(),
      completedDate.getMonth(),
      completedDate.getDate()
    );

    if (dateOnly.getTime() === today.getTime()) {
      groups[0].events.push(dto);
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      groups[1].events.push(dto);
    } else if (dateOnly >= last7) {
      groups[2].events.push(dto);
    } else {
      groups[3].events.push(dto);
    }
  }

  // Remove empty groups
  return groups.filter(g => g.events.length > 0);
}

// ─── Error map ────────────────────────────────────────────────────────────────
export const CDF_ERRORS: Record<string, { status: number; message: string }> = {
  INVALID_ID:          { status: 400, message: "Invalid ID format."                   },
  EVENT_NOT_FOUND:     { status: 404, message: "CDF event not found."                 },
  INVALID_FOCUS_SCORE: { status: 400, message: "Focus score must be between 0–100."   },
};

export function resolveCdfError(
  err: unknown
): { status: number; message: string } {
  const code = err instanceof Error ? err.message : "UNKNOWN";
  console.error("[CdfService] Error:", code, err);
  return (
    CDF_ERRORS[code] ?? {
      status:  500,
      message: "Something went wrong. Please try again.",
    }
  );
}