// models/cdfScore.model.ts

import mongoose, {
  Schema,
  model,
  models,
  Model,
} from "mongoose";
import type { ICdfScore } from "@/types/cdf";

const CdfScoreSchema = new Schema<ICdfScore>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true,        // one score doc per user — updated in place
      index:    true,
    },

    // ── Consistency ────────────────────────────────────────────────────────
    consistencyScore: {
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },

    consistencyStreak: {
      type:    Number,
      default: 0,
      min:     0,
    },

    longestStreak: {
      type:    Number,
      default: 0,
      min:     0,
    },

    totalExpected: {
      type:    Number,
      default: 0,
      min:     0,
    },

    totalCompleted: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Discipline ─────────────────────────────────────────────────────────
    disciplineScore: {
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },

    onTimeCount: {
      type:    Number,
      default: 0,
      min:     0,
    },

    totalTimedTasks: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Focus ──────────────────────────────────────────────────────────────
    focusScore: {
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },

    focusEntries: {
      type:    Number,
      default: 0,
      min:     0,
    },

    focusTotal: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Window ─────────────────────────────────────────────────────────────
    windowStart: {
      type:     Date,
      required: true,
    },

    windowEnd: {
      type:     Date,
      required: true,
    },

    lastCalculatedAt: {
      type:     Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const CdfScoreModel: Model<ICdfScore> =
  models.CdfScore ??
  model<ICdfScore>("CdfScore", CdfScoreSchema);