/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/tasks/route.ts
// GET  /api/tasks  — get all tasks (grouped by status)
// POST /api/tasks  — create a new task

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/middlewares/authMiddleware";
import { withRateLimit, RATE_LIMIT_PRESETS } from "@/middlewares/rateLimit";
import { isValidObjectId } from "@/middlewares/validateObjectId";
import {
  getUserTasks,
  createTask,
  resolveTaskError,
} from "@/services/taskService";
import type { AccessTokenPayload } from "@/types/auth";

export const runtime = "nodejs";

// ─── Validation schemas ───────────────────────────────────────────────────────
const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(1,   "Title is required")
    .max(255, "Title must be at most 255 characters")
    .trim(),

  listId: z
    .string()
    .min(1, "listId is required")
    .refine(isValidObjectId, "Invalid listId format"),

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

  repeat: z
    .enum(["none", "daily", "weekdays", "weekly", "monthly", "yearly"])
    .optional()
    .default("none"),
});

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
const getHandler = async (
  req:  NextRequest,
  _ctx: { params: Record<string, string> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const { searchParams } = req.nextUrl;

    // Parse query params
    const listId           = searchParams.get("listId")           ?? undefined;
    const search           = searchParams.get("search")           ?? undefined;
    const grouped          = searchParams.get("grouped")          !== "false";
    const includeCompleted = searchParams.get("includeCompleted") !== "false";

    // Validate listId if provided
    if (listId && !isValidObjectId(listId)) {
      return NextResponse.json(
        { error: "Invalid listId format." },
        { status: 400 }
      );
    }

    const tasks = await getUserTasks(user.userId, {
      listId,
      search,
      grouped,
      includeCompleted,
    });

    return NextResponse.json(
      { data: tasks },
      { status: 200 }
    );
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
const postHandler = async (
  req:  NextRequest,
  _ctx: { params: Record<string, string> },
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
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:  "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // 3. Create
    const task = await createTask(user.userId, parsed.data);

    return NextResponse.json(
      { data: task },
      { status: 201 }
    );
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── Export with middleware ───────────────────────────────────────────────────
export const GET  = withAuth(getHandler);

// Create the rate-limited and authenticated POST handler
const authenticatedPostHandler = withAuth(postHandler);
export const POST = withRateLimit(RATE_LIMIT_PRESETS.api, authenticatedPostHandler);
