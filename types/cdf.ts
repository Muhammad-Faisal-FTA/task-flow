// types/cdf.ts

import { Types } from "mongoose";

// ─── CDF Toggle ───────────────────────────────────────────────────────────────
export interface ICdfSettings {
  _id:       Types.ObjectId;
  userId:    Types.ObjectId;
  enabled:   boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Event type ───────────────────────────────────────────────────────────────
// Single event = one task completion while CDF is ON
export interface ICdfEvent {
  _id:          Types.ObjectId;
  userId:       Types.ObjectId;
  taskId:       Types.ObjectId;
  taskTitle:    string;
  listId:       Types.ObjectId;
  repeat:       "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";

  // Due info — for discipline calculation
  dueDate:      Date | null;
  dueTime:      string | null;        // "HH:MM"

  // Completion info
  completedAt:  Date;                 // exact timestamp of checkbox tap
  onTime:       boolean;              // completedAt ≤ dueDate+dueTime (+1min buffer)
  lateByMs:     number;               // ms late (0 if on time)

  // Focus
  focusScore:   number | null;        // 0–100, null until user submits
  focusEnteredAt: Date | null;        // when user submitted focus score

  createdAt:    Date;
  updatedAt:    Date;
}

// ─── Aggregated scores ────────────────────────────────────────────────────────
// Pre-calculated rolling 30-day scores — updated on every event
export interface ICdfScore {
  _id:    Types.ObjectId;
  userId: Types.ObjectId;

  // ── Consistency ─────────────────────────────────────────────────────────
  consistencyScore:  number;          // 0–100
  consistencyStreak: number;          // current consecutive days streak
  longestStreak:     number;          // all-time longest streak
  totalExpected:     number;          // repeat task occurrences expected in window
  totalCompleted:    number;          // actually completed in window

  // ── Discipline ───────────────────────────────────────────────────────────
  disciplineScore:   number;          // 0–100
  onTimeCount:       number;          // completed before/by dueTime
  totalTimedTasks:   number;          // tasks with dueTime set

  // ── Focus ────────────────────────────────────────────────────────────────
  focusScore:        number;          // 0–100 rolling average
  focusEntries:      number;          // how many focus scores entered
  focusTotal:        number;          // sum of all focus scores (for avg calc)

  // ── Window ───────────────────────────────────────────────────────────────
  windowStart:       Date;            // 30 days ago
  windowEnd:         Date;            // now
  lastCalculatedAt:  Date;

  createdAt:         Date;
  updatedAt:         Date;
}

// ─── DTO shapes (API responses) ───────────────────────────────────────────────

export interface CdfSettingsDTO {
  enabled:   boolean;
  updatedAt: string;
}

export interface CdfEventDTO {
  id:             string;
  taskId:         string;
  taskTitle:      string;
  listId:         string;
  repeat:         ICdfEvent["repeat"];
  dueDate:        string | null;
  dueTime:        string | null;
  completedAt:    string;
  onTime:         boolean;
  lateByMs:       number;
  focusScore:     number | null;
  focusEnteredAt: string | null;
  createdAt:      string;
}

export interface CdfScoreDTO {
  // Consistency
  consistencyScore:  number;
  consistencyStreak: number;
  longestStreak:     number;
  totalExpected:     number;
  totalCompleted:    number;

  // Discipline
  disciplineScore:   number;
  onTimeCount:       number;
  totalTimedTasks:   number;

  // Focus
  focusScore:        number;
  focusEntries:      number;

  // Meta
  windowStart:       string;
  windowEnd:         string;
  lastCalculatedAt:  string;

  // Computed grades
  consistencyGrade:  "S" | "A" | "B" | "C" | "D" | "F";
  disciplineGrade:   "S" | "A" | "B" | "C" | "D" | "F";
  focusGrade:        "S" | "A" | "B" | "C" | "D" | "F";

  // Overall CDF score (weighted average)
  overallScore:      number;
}

// ─── Grouped events (for history view) ───────────────────────────────────────
export interface CdfEventGroup {
  label:  "Today" | "Yesterday" | "Last 7 Days" | "Older";
  events: CdfEventDTO[];
}

// ─── Focus popup state ────────────────────────────────────────────────────────
export interface FocusPopupState {
  isOpen:    boolean;
  eventId:   string | null;          // CDF event to attach focus score to
  taskTitle: string;
  score:     number;                 // slider value 0–100
}

// ─── API input shapes ─────────────────────────────────────────────────────────
export interface CreateCdfEventInput {
  taskId:    string;
  taskTitle: string;
  listId:    string;
  repeat:    ICdfEvent["repeat"];
  dueDate:   string | null;
  dueTime:   string | null;
}

export interface SubmitFocusInput {
  focusScore: number;               // 0–100
}

// ─── Grade thresholds ─────────────────────────────────────────────────────────
export type CdfGrade = "S" | "A" | "B" | "C" | "D" | "F";

export function getGrade(score: number): CdfGrade {
  if (score >= 95) return "S";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

export const GRADE_COLOR: Record<CdfGrade, string> = {
  S: "#29B6F6",   // highlight blue — legendary
  A: "#43A047",   // green — excellent
  B: "#1E8BC3",   // primary blue — good
  C: "#F57C00",   // orange — average
  D: "#E53935",   // red — poor
  F: "#546E7A",   // grey — failing
};

export const GRADE_LABEL: Record<CdfGrade, string> = {
  S: "Legendary",
  A: "Excellent",
  B: "Good",
  C: "Average",
  D: "Poor",
  F: "Failing",
};