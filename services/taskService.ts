// services/taskService.ts

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { TaskModel } from "@/models/task.model";
import { TaskListModel } from "@/models/taskList.model";
import { deriveStatus, parseDueDate, formatDueDate } from "@/utils/deriveStatus";
import {
  groupTasksByStatus,
  filterByList,
  searchTasks,
  filterNotDeleted,
  countOverdue,
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

// Serialise Mongoose Task document → clean TaskDTO
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

// Serialise Mongoose TaskList document → clean TaskListDTO
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
  INVALID_ID:          { status: 400,  message: "Invalid ID format." },
  TASK_NOT_FOUND:      { status: 404,  message: "Task not found." },
  LIST_NOT_FOUND:      { status: 404,  message: "List not found." },
  FORBIDDEN:           { status: 403,  message: "You do not have permission to perform this action." },
  LIST_NAME_TAKEN:     { status: 409,  message: "A list with this name already exists." },
  CANNOT_DELETE_DEFAULT: { status: 400, message: "Cannot delete the default list." },
  LIST_HAS_TASKS:      { status: 400,  message: "Cannot delete a list that contains tasks. Move or delete tasks first." },
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

// ═════════════════════════════════════════════════════════════════════════════
// TASK LIST OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════

// ─── Create default list (called on user registration) ────────────────────────
export async function createDefaultList(
  userId: string
): Promise<TaskListDTO> {
  await connectDB();

  const existing = await TaskListModel.findOne({
    userId:    toObjectId(userId),
    isDefault: true,
  });

  // Idempotent — don't create duplicate default list
  if (existing) return serialiseList(existing);

  const list = await TaskListModel.create({
    userId:    toObjectId(userId),
    name:      "Default",
    color:     "#1E8BC3",
    isDefault: true,
  });

  return serialiseList(list);
}

// ─── Get all lists for a user ─────────────────────────────────────────────────
export async function getUserLists(
  userId: string
): Promise<TaskListDTO[]> {
  await connectDB();

  const [lists, counts] = await Promise.all([
    // Get all lists sorted — default first, then by createdAt
    TaskListModel
      .find({ userId: toObjectId(userId) })
      .sort({ isDefault: -1, createdAt: 1 })
      .lean(),

    // Aggregation — task + overdue counts per list in one query
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
                    { $eq:  ["$completed", false] },
                    { $lt:  ["$dueDate", new Date()] },
                    { $ne:  ["$dueDate", null] },
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

  // Build lookup map listId → counts
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
    return serialiseList(doc as unknown as ITaskList, c.taskCount, c.overdueCount);
  });
}

// ─── Create list ──────────────────────────────────────────────────────────────
export async function createList(
  userId: string,
  input: CreateListInput
): Promise<TaskListDTO> {
  await connectDB();

  // Check duplicate name
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

// ─── Update list (rename / recolor) ──────────────────────────────────────────
export async function updateList(
  userId: string,
  listId: string,
  input: UpdateListInput
): Promise<TaskListDTO> {
  await connectDB();

  const list = await TaskListModel.findOne({
    _id:    toObjectId(listId),
    userId: toObjectId(userId),
  });

  if (!list) throw new Error("LIST_NOT_FOUND");

  // Check duplicate name if renaming
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

// ─── Delete list ──────────────────────────────────────────────────────────────
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

  // Cannot delete default list
  if (list.isDefault) throw new Error("CANNOT_DELETE_DEFAULT");

  // Check if list has active tasks
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

// ─── Get all tasks for a user ─────────────────────────────────────────────────
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

  // Build query filter
  const filter: mongoose.FilterQuery<ITask> = {
    userId:    toObjectId(userId),
    deletedAt: null,             // active tasks only by default
  };

  if (listId) filter.listId = toObjectId(listId);
  if (!includeCompleted) filter.completed = false;

  // Text search — FR-10
  if (search?.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const docs = await TaskModel
    .find(filter)
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();

  let tasks = docs.map((doc) =>
    serialiseTask(doc as unknown as ITask)
  );

  // Client-side search fallback (for partial matches)
  if (search?.trim()) {
    tasks = searchTasks(tasks, search);
  }

  // Return grouped or flat
  return grouped ? groupTasksByStatus(tasks) : tasks;
}

// ─── Get single task ──────────────────────────────────────────────────────────
export async function getTaskById(
  userId: string,
  taskId: string
): Promise<TaskDTO> {
  await connectDB();

  const doc = await TaskModel.findOne({
    _id:    toObjectId(taskId),
    userId: toObjectId(userId),   // ownership check
  }).lean();

  if (!doc) throw new Error("TASK_NOT_FOUND");

  return serialiseTask(doc as unknown as ITask);
}

// ─── Create task ──────────────────────────────────────────────────────────────
export async function createTask(
  userId: string,
  input: CreateTaskInput
): Promise<TaskDTO> {
  await connectDB();

  // Verify list belongs to user
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

// ─── Update task ──────────────────────────────────────────────────────────────
export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<TaskDTO> {
  await connectDB();

  const doc = await TaskModel.findOne({
    _id:    toObjectId(taskId),
    userId: toObjectId(userId),   // ownership check
  });

  if (!doc) throw new Error("TASK_NOT_FOUND");

  // If moving to different list — verify new list belongs to user
  if (input.listId && input.listId !== doc.listId.toString()) {
    const list = await TaskListModel.findOne({
      _id:    toObjectId(input.listId),
      userId: toObjectId(userId),
    });
    if (!list) throw new Error("LIST_NOT_FOUND");
    doc.listId = toObjectId(input.listId);
  }

  if (input.title     !== undefined) doc.title   = input.title.trim();
  if (input.dueDate   !== undefined) doc.dueDate  = parseDueDate(input.dueDate);
  if (input.dueTime   !== undefined) doc.dueTime  = input.dueTime ?? null;
  if (input.repeat    !== undefined) doc.repeat   = input.repeat;
  if (input.completed !== undefined) doc.completed = input.completed;

  await doc.save();
  return serialiseTask(doc);
}

// ─── Toggle complete ──────────────────────────────────────────────────────────
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

  doc.completed = !doc.completed;
  await doc.save();

  return serialiseTask(doc);
}

// ─── Soft delete task (FR-15 undo ready) ──────────────────────────────────────
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

  // Soft delete — set deletedAt, don't remove from DB
  doc.deletedAt = new Date();
  await doc.save();

  // Return deleted task so client can offer undo (FR-15)
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

// ─── Permanent delete (cleanup) ───────────────────────────────────────────────
// Called after undo window expires or user explicitly purges
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

// ─── Get deleted tasks (for undo list FR-15) ───────────────────────────────────
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