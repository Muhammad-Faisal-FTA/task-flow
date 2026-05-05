// models/cdfEvent.model.ts

import mongoose, {
  Schema,
  model,
  models,
  Model,
} from "mongoose";
import type { ICdfEvent } from "@/types/cdf";

const CdfEventSchema = new Schema<ICdfEvent>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },

    taskId: {
      type:     Schema.Types.ObjectId,
      ref:      "Task",
      required: true,
    },

    taskTitle: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 255,
    },

    listId: {
      type:     Schema.Types.ObjectId,
      ref:      "TaskList",
      required: true,
    },

    repeat: {
      type: String,
      enum: ["none", "daily", "weekdays", "weekly", "monthly", "yearly"],
      required: true,
    },

    // Due info
    dueDate: {
      type:    Date,
      default: null,
    },

    dueTime: {
      type:    String,
      default: null,
      match:   [/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid HH:MM format"],
    },

    // Completion
    completedAt: {
      type:     Date,
      required: true,
    },

    onTime: {
      type:     Boolean,
      required: true,
    },

    lateByMs: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // Focus
    focusScore: {
      type:    Number,
      default: null,
      min:     0,
      max:     100,
    },

    focusEnteredAt: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary query — all events for a user in date range
CdfEventSchema.index(
  { userId: 1, completedAt: -1 },
  { name: "user_completed_desc" }
);

// Consistency queries — repeat tasks only
CdfEventSchema.index(
  { userId: 1, repeat: 1, completedAt: -1 },
  { name: "user_repeat_completed" }
);

// Discipline queries — timed tasks only
CdfEventSchema.index(
  { userId: 1, onTime: 1, completedAt: -1 },
  { name: "user_ontime_completed" }
);

// Focus queries — scored entries only
CdfEventSchema.index(
  { userId: 1, focusScore: 1, completedAt: -1 },
  { name: "user_focus_completed" }
);

export const CdfEventModel: Model<ICdfEvent> =
  models.CdfEvent ??
  model<ICdfEvent>("CdfEvent", CdfEventSchema);