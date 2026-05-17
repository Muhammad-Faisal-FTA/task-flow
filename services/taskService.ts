// services/taskService.ts

import mongoose from "mongoose";
import { connectDB }       from "@/lib/mongoose";
import { TaskModel }       from "@/models/task.model";
import { TaskListModel }   from "@/models/taskList.model";
import {
  deriveStatus,
  parseDueDate,
  formatDueDate,
} from "@/utils/deriveStatus";
import {
  groupTasksByStatus,
  searchTasks,
} from "@/utils/taskGrouping";
import type {
  ITask,
  ITaskList,
  TaskDTO,
  TaskListDTO,
  GroupedTasks,
  CreateTaskInput,
  UpdateTaskInput,
  CreateListInput,
  UpdateListInput,
  TaskQueryParams,
} from "@/types/task";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_ID");
  }
  return new mongoose.Types.ObjectId(id);
}

function serialiseTask(doc: ITask): TaskDTO {
  return {
    id:          doc._id.toString(),
    userId:      doc.userId.toString(),
    listId:      doc.listId.toString(),
    title:       doc.title,
    completed:   doc.completed,
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    dueDate:     formatDueDate(doc.dueDate),
    dueTime:     doc.dueTime ?? null,
    repeat:      doc.repeat,
    status:      deriveStatus(doc.dueDate, doc.completed, doc.deletedAt),
    deletedAt:   doc.deletedAt ? doc.deletedAt.toISOString() : null,
    createdAt:   doc.createdAt.toISOString(),
    updatedAt:   doc.updatedAt.toISOString(),
  };
}

function serialiseList(
  doc: ITaskList,
  taskCount    = 0,
  overdueCount = 0
): TaskListDTO {
  return {
    id:          doc._id.toString(),
    userId:      doc.userId.toString(),
    name:        doc.name,
    color:       doc.color,
    isDefault:   doc.isDefault,
    taskCount,
    overdueCount,
    createdAt:   doc.createdAt.toISOString(),
    updatedAt:   doc.updatedAt.toISOString(),
  };
}

// ─── Error codes ──────────────────────────────────────────────────────────────

export const TASK_ERRORS: Record<string, { status: number; message: string }> = {
  INVALID_ID:            { status: 400, message: "Invalid ID format."                                                    },
  TASK_NOT_FOUND:        { status: 404, message: "Task not found."                                                       },
  LIST_NOT_FOUND:        { status: 404, message: "List not found."                                                       },
  FORBIDDEN:             { status: 403, message: "You do not have permission to perform this action."                    },
  LIST_NAME_TAKEN:       { status: 409, message: "A list with this name already exists."                                 },
  CANNOT_DELETE_DEFAULT: { status: 400, message: "Cannot delete the default list."                                       },
  LIST_HAS_TASKS:        { status: 400, message: "Cannot delete a list that contains tasks. Move or delete tasks first." },
};

export function resolveTaskError(
  err: unknown
): { status: number; message: string } {
  const code = err instanceof Error ? err.message : "UNKNOWN";
  console.error("[TaskService] Error:", code, err);
  return (
    TASK_ERRORS[code] ?? {
      status:  500,
      message: "Something went wrong. Please try again.",
    }
  );
}

// ─── Repeat: next due date calculation ───────────────────────────────────────
function getNextDueDate(
  currentDueDate: Date,
  repeat: string
): Date | null {
  const d = new Date(currentDueDate);

  switch (repeat) {
    case "daily":
      d.setDate(d.getDate() + 1);
      return d;

    case "weekdays": {
      // Skip Saturday (6) and Sunday (0)
      d.setDate(d.getDate() + 1);
      while (d.getDay() === 0 || d.getDay() === 6) {
        d.setDate(d.getDate() + 1);
      }
      return d;
    }

    case "weekly":
      d.setDate(d.getDate() + 7);
      return d;

    case "monthly":
      d.setMonth(d.getMonth() + 1);
      return d;

    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      return d;

    default:
      return null;
  }
}

// ─── Create next occurrence ───────────────────────────────────────────────────
// Called async after toggle — never blocks the API response
async function createNextOccurrence(
  completedTask: ITask
): Promise<void> {
  // Only repeat tasks with a due date
  if (
    completedTask.repeat === "none" ||
    !completedTask.dueDate
  ) return;

  const nextDueDate = getNextDueDate(
    completedTask.dueDate,
    completedTask.repeat
  );

  if (!nextDueDate) return;

  // Duplicate guard — prevent creating twice if toggled rapidly
  const existing = await TaskModel.findOne({
    userId:    completedTask.userId,
    listId:    completedTask.listId,
    title:     completedTask.title,
    repeat:    completedTask.repeat,
    dueDate:   nextDueDate,
    deletedAt: null,
    completed: false,
  });

  if (existing) return;

  await TaskModel.create({
    userId:    completedTask.userId,
    listId:    completedTask.listId,
    title:     completedTask.title,
    dueDate:   nextDueDate,
    dueTime:   completedTask.dueTime,
    repeat:    completedTask.repeat,
    completed: false,
    deletedAt: null,
  });

  console.log(
    `[TaskService] Created next occurrence of "${completedTask.title}" for ${nextDueDate.toISOString().split("T")[0]}`
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TASK LIST OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════

export async function createDefaultList(
  userId: string
): Promise<TaskListDTO> {
  await connectDB();

  const existing = await TaskListModel.findOne({
    userId:    toObjectId(userId),
    isDefault: true,
  });

  if (existing) return serialiseList(existing);

  const list = await TaskListModel.create({
    userId:    toObjectId(userId),
    name:      "Default",
    color:     "#1E8BC3",
    isDefault: true,
  });

  return serialiseList(list);
}

export async function getUserLists(
  userId: string
): Promise<TaskListDTO[]> {
  await connectDB();

  const [lists, counts] = await Promise.all([
    TaskListModel
      .find({ userId: toObjectId(userId) })
      .sort({ isDefault: -1, createdAt: 1 })
      .lean(),

    TaskModel.aggregate([
      {
        $match: {
          userId:    toObjectId(userId),
          deletedAt: null,
        },
      },
      {
        $group: {
          _id:          "$listId",
          taskCount:    { $sum: 1 },
          overdueCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$completed", false] },
                    { $lt: ["$dueDate", new Date()] },
                    { $ne: ["$dueDate", null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const countMap = new Map(
    counts.map((c) => [
      c._id.toString(),
      { taskCount: c.taskCount, overdueCount: c.overdueCount },
    ])
  );

  return lists.map((doc) => {
    const c = countMap.get(doc._id.toString()) ?? {
      taskCount:    0,
      overdueCount: 0,
    };
    return serialiseList(
      doc as unknown as ITaskList,
      c.taskCount,
      c.overdueCount
    );
  });
}

export async function createList(
  userId: string,
  input:  CreateListInput
): Promise<TaskListDTO> {
  await connectDB();

  const existing = await TaskListModel.findOne({
    userId: toObjectId(userId),
    name:   { $regex: new RegExp(`^${input.name.trim()}$`, "i") },
  });
  if (existing) throw new Error("LIST_NAME_TAKEN");

  const list = await TaskListModel.create({
    userId: toObjectId(userId),
    name:   input.name.trim(),
    color:  input.color,
  });

  return serialiseList(list);
}

export async function updateList(
  userId: string,
  listId: string,
  input:  UpdateListInput
): Promise<TaskListDTO> {
  await connectDB();

  const list = await TaskListModel.findOne({
    _id:    toObjectId(listId),
    userId: toObjectId(userId),
  });
  if (!list) throw new Error("LIST_NOT_FOUND");

  if (input.name && input.name.trim() !== list.name) {
    const duplicate = await TaskListModel.findOne({
      userId: toObjectId(userId),
      name:   { $regex: new RegExp(`^${input.name.trim()}$`, "i") },
      _id:    { $ne: toObjectId(listId) },
    });
    if (duplicate) throw new Error("LIST_NAME_TAKEN");
    list.name = input.name.trim();
  }

  if (input.color) list.color = input.color;

  await list.save();
  return serialiseList(list);
}

export async function deleteList(
  userId: string,
  listId: string
): Promise<{ message: string }> {
  await connectDB();

  const list = await TaskListModel.findOne({
    _id:    toObjectId(listId),
    userId: toObjectId(userId),
  });
  if (!list) throw new Error("LIST_NOT_FOUND");
  if (list.isDefault) throw new Error("CANNOT_DELETE_DEFAULT");

  const taskCount = await TaskModel.countDocuments({
    listId:    toObjectId(listId),
    deletedAt: null,
  });
  if (taskCount > 0) throw new Error("LIST_HAS_TASKS");

  await TaskListModel.findByIdAndDelete(toObjectId(listId));
  return { message: "List deleted successfully." };
}

// ═════════════════════════════════════════════════════════════════════════════
// TASK OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════

export async function getUserTasks(
  userId: string,
  params: TaskQueryParams = {}
): Promise<GroupedTasks | TaskDTO[]> {
  await connectDB();

  const {
    listId,
    grouped          = true,
    includeCompleted = true,
    search,
  } = params;

  const filter: mongoose.FilterQuery<ITask> = {
    userId:    toObjectId(userId),
    deletedAt: null,
  };

  if (listId)            filter.listId    = toObjectId(listId);
  if (!includeCompleted) filter.completed = false;
  if (search?.trim())    filter.$text     = { $search: search.trim() };

  const docs = await TaskModel
    .find(filter)
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();

  let tasks = docs.map((doc) => serialiseTask(doc as unknown as ITask));

  if (search?.trim()) {
    tasks = searchTasks(tasks, search);
  }

  return grouped ? groupTasksByStatus(tasks) : tasks;
}

export async function getTaskById(
  userId: string,
  taskId: string
): Promise<TaskDTO> {
  await connectDB();

  const doc = await TaskModel.findOne({
    _id:    toObjectId(taskId),
    userId: toObjectId(userId),
  }).lean();

  if (!doc) throw new Error("TASK_NOT_FOUND");
  return serialiseTask(doc as unknown as ITask);
}

export async function createTask(
  userId: string,
  input:  CreateTaskInput
): Promise<TaskDTO> {
  await connectDB();

  const list = await TaskListModel.findOne({
    _id:    toObjectId(input.listId),
    userId: toObjectId(userId),
  });
  if (!list) throw new Error("LIST_NOT_FOUND");

  const doc = await TaskModel.create({
    userId:  toObjectId(userId),
    listId:  toObjectId(input.listId),
    title:   input.title.trim(),
    dueDate: parseDueDate(input.dueDate),
    dueTime: input.dueTime ?? null,
    repeat:  input.repeat ?? "none",
  });

  return serialiseTask(doc);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input:  UpdateTaskInput
): Promise<TaskDTO> {
  await connectDB();

  const doc = await TaskModel.findOne({
    _id:    toObjectId(taskId),
    userId: toObjectId(userId),
  });
  if (!doc) throw new Error("TASK_NOT_FOUND");

  if (input.listId && input.listId !== doc.listId.toString()) {
    const list = await TaskListModel.findOne({
      _id:    toObjectId(input.listId),
      userId: toObjectId(userId),
    });
    if (!list) throw new Error("LIST_NOT_FOUND");
    doc.listId = toObjectId(input.listId);
  }

  if (input.title     !== undefined) doc.title     = input.title.trim();
  if (input.dueDate   !== undefined) doc.dueDate   = parseDueDate(input.dueDate);
  if (input.dueTime   !== undefined) doc.dueTime   = input.dueTime ?? null;
  if (input.repeat    !== undefined) doc.repeat    = input.repeat;
  if (input.completed !== undefined) doc.completed = input.completed;

  await doc.save();
  return serialiseTask(doc);
}

// ─── Toggle complete — with auto next occurrence ──────────────────────────────
export async function toggleTaskComplete(
  userId: string,
  taskId: string
): Promise<TaskDTO> {
  await connectDB();

  const doc = await TaskModel.findOne({
    _id:    toObjectId(taskId),
    userId: toObjectId(userId),
  });
  if (!doc) throw new Error("TASK_NOT_FOUND");

  const wasCompleted = doc.completed;
  doc.completed      = !doc.completed;
  await doc.save();

  // If just completed (not uncompleted) + has repeat frequency
  // → create next occurrence asynchronously (non-blocking)
  if (!wasCompleted && doc.completed && doc.repeat !== "none") {
    createNextOccurrence(doc).catch((err) =>
      console.error("[TaskService] Failed to create next occurrence:", err)
    );
  }

  return serialiseTask(doc);
}

// ─── Soft delete (FR-15) ─────────────────────────────────────────────────────
export async function deleteTask(
  userId: string,
  taskId: string
): Promise<TaskDTO> {
  await connectDB();

  const doc = await TaskModel.findOne({
    _id:    toObjectId(taskId),
    userId: toObjectId(userId),
  });
  if (!doc) throw new Error("TASK_NOT_FOUND");

  doc.deletedAt = new Date();
  await doc.save();

  return serialiseTask(doc);
}

// ─── Restore task (FR-15 undo) ────────────────────────────────────────────────
export async function restoreTask(
  userId: string,
  taskId: string
): Promise<TaskDTO> {
  await connectDB();

  const doc = await TaskModel.findOne({
    _id:    toObjectId(taskId),
    userId: toObjectId(userId),
  });
  if (!doc) throw new Error("TASK_NOT_FOUND");

  doc.deletedAt = null;
  await doc.save();

  return serialiseTask(doc);
}

// ─── Permanent delete ─────────────────────────────────────────────────────────
export async function permanentDeleteTask(
  userId: string,
  taskId: string
): Promise<{ message: string }> {
  await connectDB();

  const result = await TaskModel.findOneAndDelete({
    _id:    toObjectId(taskId),
    userId: toObjectId(userId),
  });
  if (!result) throw new Error("TASK_NOT_FOUND");

  return { message: "Task permanently deleted." };
}

// ─── Get deleted tasks (FR-15) ────────────────────────────────────────────────
export async function getDeletedTasks(
  userId: string
): Promise<TaskDTO[]> {
  await connectDB();

  const docs = await TaskModel
    .find({
      userId:    toObjectId(userId),
      deletedAt: { $ne: null },
    })
    .sort({ deletedAt: -1 })
    .lean();

  return docs.map((doc) => serialiseTask(doc as unknown as ITask));
}