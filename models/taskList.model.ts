// models/TaskList.ts

import mongoose, {
  Schema,
  model,
  models,
  Model,
} from "mongoose";
import type { ITaskList } from "@/types/task";

// ─── Schema ───────────────────────────────────────────────────────────────────
const TaskListSchema = new Schema<ITaskList>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "userId is required"],
      index:    true,               // NFR Performance — fast user list queries
    },

    name: {
      type:      String,
      required:  [true, "List name is required"],
      trim:      true,
      minlength: [1,  "List name cannot be empty"],
      maxlength: [50, "List name must be at most 50 characters"],
    },

    color: {
      type:     String,
      required: [true, "Color is required"],
      match:    [
        /^#[0-9A-Fa-f]{6}$/,
        "Color must be a valid hex e.g. #1E8BC3",
      ],
      default: "#1E8BC3",
    },

    isDefault: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound index — all lists for a user, fast lookup
TaskListSchema.index({ userId: 1, createdAt: 1 });

// Unique constraint — one Default list per user
TaskListSchema.index(
  { userId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true }, // only enforce on default lists
    name: "unique_default_per_user",
  }
);

// Unique constraint — no duplicate list names per user
TaskListSchema.index(
  { userId: 1, name: 1 },
  {
    unique: true,
    name: "unique_name_per_user",
  }
);

// ─── Sanitize toJSON ──────────────────────────────────────────────────────────
TaskListSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id  = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

// ─── Model guard ──────────────────────────────────────────────────────────────
export const TaskListModel: Model<ITaskList> =
  models.TaskList ?? model<ITaskList>("TaskList", TaskListSchema);