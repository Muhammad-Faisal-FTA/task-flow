// app/api/tasks/[taskId]/route.ts
// GET    /api/tasks/:taskId  — get single task
// PATCH  /api/tasks/:taskId  — update task (partial)
// DELETE /api/tasks/:taskId  — soft delete task (FR-15)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuthAndId } from "@/middlewares/validateObjectId";
import { isValidObjectId } from "@/middlewares/validateObjectId";
import {
  getTaskById,
  updateTask,
  deleteTask,
  restoreTask,
  permanentDeleteTask,
  toggleTaskComplete,
  resolveTaskError,
} from "@/services/taskService";
import type { AccessTokenPayload } from "@/types/auth";

export const runtime = "nodejs";

// ─── Validation schema ────────────────────────────────────────────────────────
const repeatDaysSchema = z.array(z.number().int().min(0).max(6)).max(7).refine(
  (days) => new Set(days).size === days.length,
  "Weekdays must not be repeated",
);

const UpdateTaskSchema = z.object({
  title: z
    .string()
    .min(1,   "Title cannot be empty")
    .max(255, "Title must be at most 255 characters")
    .trim()
    .optional(),

  listId: z
    .string()
    .refine(isValidObjectId, "Invalid listId format")
    .optional(),

  dueDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "dueDate must be in YYYY-MM-DD format"
    )
    .nullable()
    .optional(),

  dueTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "dueTime must be in HH:MM format"
    )
    .nullable()
    .optional(),

  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  priority: z.enum(["A", "B", "C", "D"]).optional(),
  cdfTracking: z.boolean().optional(),

  repeat: z
    .enum(["none", "daily", "weekdays", "weekly", "monthly", "yearly", "custom"])
    .optional(),
  repeatDays: repeatDaysSchema.optional(),
  repeatEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "repeatEndDate must be in YYYY-MM-DD format").nullable().optional(),

  links: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(100),
    url: z.string().url(),
  })).optional(),

  completed: z
    .boolean()
    .optional(),

  // Special actions via PATCH
  // toggle: true  → flip completed state       (FR-04)
  // restore: true → undo soft delete           (FR-15)
  toggle:  z.boolean().optional(),
  restore: z.boolean().optional(),
}).superRefine((task, context) => {
  if (task.repeat === "custom" && !task.repeatDays?.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["repeatDays"], message: "Select at least one weekday for a custom repeat." });
  }
  if (task.dueDate && task.repeatEndDate && task.repeatEndDate < task.dueDate) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["repeatEndDate"], message: "Repeat end date cannot be before the due date." });
  }
}).strict(); // reject unknown fields

// ─── GET /api/tasks/:taskId ───────────────────────────────────────────────────
const getHandler = async (
  _req: NextRequest,
  ctx:  { params: Promise<Record<string, string>> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const { taskId } = await ctx.params;
    const task = await getTaskById(user.userId, taskId);
    return NextResponse.json({ data: task }, { status: 200 });
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── PATCH /api/tasks/:taskId ─────────────────────────────────────────────────
const patchHandler = async (
  req:  NextRequest,
  ctx:  { params: Promise<Record<string, string>> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    // 1. Parse body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 2. Validate
    const parsed = UpdateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:  "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { toggle, restore, ...updateData } = parsed.data;

    // Resolve params once
    const { taskId } = await ctx.params;

    // 3. Route to correct service function based on action

    // FR-04 — toggle completed
    if (toggle === true) {
      const task = await toggleTaskComplete(user.userId, taskId);
      return NextResponse.json({ data: task }, { status: 200 });
    }

    // FR-15 — restore soft deleted task
    if (restore === true) {
      const task = await restoreTask(user.userId, taskId);
      return NextResponse.json({ data: task }, { status: 200 });
    }

    // FR-02 — standard partial update
    const task = await updateTask(user.userId, taskId, updateData);
    return NextResponse.json({ data: task }, { status: 200 });
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── DELETE /api/tasks/:taskId ────────────────────────────────────────────────
const deleteHandler = async (
  req:  NextRequest,
  ctx:  { params: Promise<Record<string, string>> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const { taskId } = await ctx.params;
    const { searchParams } = req.nextUrl;
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      // Hard delete — called after undo window expires
      const result = await permanentDeleteTask(
        user.userId,
        taskId
      );
      return NextResponse.json(result, { status: 200 });
    }

    // Soft delete — returns deleted task for undo toast (FR-15)
    const task = await deleteTask(user.userId, taskId);
    return NextResponse.json(
      {
        data:    task,
        message: "Task deleted. You can undo this action.",
      },
      { status: 200 }
    );
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── Export with middleware ───────────────────────────────────────────────────
export const GET    = withAuthAndId("taskId", getHandler);
export const PATCH  = withAuthAndId("taskId", patchHandler);
export const DELETE = withAuthAndId("taskId", deleteHandler);