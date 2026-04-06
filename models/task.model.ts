// models/task.model.ts

import mongoose, {
  Schema,
  model,
  models,
  Model,
} from "mongoose";
import type { ITask } from "@/types/task";

// ─── Schema ───────────────────────────────────────────────────────────────────
const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "userId is required"],
      index:    true,             // NFR Performance — fast user task queries
    },

    listId: {
      type:     Schema.Types.ObjectId,
      ref:      "TaskList",
      required: [true, "listId is required"],
      index:    true,             // NFR Performance — fast list filter queries
    },

    title: {
      type:      String,
      required:  [true, "Task title is required"],
      trim:      true,
      minlength: [1,   "Title cannot be empty"],
      maxlength: [255, "Title must be at most 255 characters"],
    },

    completed: {
      type:    Boolean,
      default: false,
    },

    completedAt: {
      type:    Date,
      default: null,
    },

    dueDate: {
      type:    Date,
      default: null,
      index:   true,             // NFR Performance — grouping + sorting queries
    },

    dueTime: {
      type:    String,
      default: null,
      match:   [
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "dueTime must be in HH:MM format",
      ],
      validate: {
        validator: (v: string | null) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
        message:   "dueTime must be in HH:MM format or null",
      },
    },

    repeat: {
      type:    String,
      enum:    {
        values:  ["none", "daily", "weekdays", "weekly", "monthly", "yearly"],
        message: "{VALUE} is not a valid repeat frequency",
      },
      default: "none",
    },

    deletedAt: {
      type:    Date,
      default: null,
      index:   true,             // NFR Performance — filter active vs deleted
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Compound Indexes (NFR Performance — <200ms) ──────────────────────────────

// Primary query — all active tasks for a user sorted by dueDate
TaskSchema.index(
  { userId: 1, dueDate: 1 },
  { name: "user_duedate" }
);

// Filter by list — FR-14
TaskSchema.index(
  { userId: 1, listId: 1, dueDate: 1 },
  { name: "user_list_duedate" }
);

// Completed tasks query
TaskSchema.index(
  { userId: 1, completed: 1, dueDate: 1 },
  { name: "user_completed_duedate" }
);

// Soft delete filter — active tasks only
TaskSchema.index(
  { userId: 1, deletedAt: 1, dueDate: 1 },
  { name: "user_deleted_duedate" }
);

// Search by title — FR-10 (text index)
TaskSchema.index(
  { title: "text" },
  { name: "task_title_text" }
);

// ─── Pre-save hook: set completedAt ──────────────────────────────────────────
// Automatically tracks when a task was completed
TaskSchema.pre("save", async function () {
  if (this.isModified("completed")) {
    this.completedAt = this.completed ? new Date() : null;
  }
});

// ─── Sanitize toJSON ──────────────────────────────────────────────────────────
TaskSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

// ─── Model guard ──────────────────────────────────────────────────────────────
export const TaskModel: Model<ITask> =
  models.Task ?? model<ITask>("Task", TaskSchema);



// ```

// ---

// **What this covers:**

// - ✅ **Performance** — 5 compound indexes covering every query pattern:
//   - `{ userId, dueDate }` — all tasks grouped by date
//   - `{ userId, listId, dueDate }` — FR-14 list filter
//   - `{ userId, completed, dueDate }` — completed tasks view
//   - `{ userId, deletedAt, dueDate }` — active vs deleted filter
//   - `{ title: "text" }` — FR-10 full-text search
// - ✅ **FR-15** — `deletedAt` soft delete field with index
// - ✅ **FR-09** — `repeat` enum validated at schema level
// - ✅ **FR-05** — `dueDate` + `dueTime` separate fields — no timezone bugs
// - ✅ **Data integrity** — `dueTime` validated twice — schema `match` + custom `validate`
// - ✅ **Pre-save hook** — `completedAt` auto-set when `completed` toggles — no manual tracking
// - ✅ **Scalability** — `toJSON` transform adds clean `id` string
// - ✅ **Naming convention** — matches your `task.model.ts` pattern

// ---

// **File naming summary so far:**
// ```
// models/
// ├── user.model.ts       ← yours (existing)
// ├── taskList.model.ts   ← Step 4
// └── task.model.ts       ← Step 5 ← just written