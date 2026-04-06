/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/lists/route.ts
// GET  /api/lists  — get all lists for current user (with task + overdue counts)
// POST /api/lists  — create a new list

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/middlewares/authMiddleware";
import { withRateLimit, RATE_LIMIT_PRESETS } from "@/middlewares/rateLimit";
import {
  getUserLists,
  createList,
  resolveTaskError,
} from "@/services/taskService";
import type { AccessTokenPayload } from "@/types/auth";

export const runtime = "nodejs";

// ─── Validation schema ────────────────────────────────────────────────────────
const CreateListSchema = z.object({
  name: z
    .string()
    .min(1,  "List name is required")
    .max(50, "List name must be at most 50 characters")
    .trim(),

  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Color must be a valid hex color e.g. #1E8BC3"
    )
    .default("#1E8BC3"),
}).strict();

// ─── GET /api/lists ───────────────────────────────────────────────────────────
const getHandler = async (
  _req: NextRequest,
  _ctx: { params: Record<string, string> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const lists = await getUserLists(user.userId);

    return NextResponse.json(
      { data: lists },
      { status: 200 }
    );
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── POST /api/lists ──────────────────────────────────────────────────────────
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
    const parsed = CreateListSchema.safeParse(body);
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
    const list = await createList(user.userId, parsed.data);

    return NextResponse.json(
      { data: list },
      { status: 201 }
    );
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── Export with middleware ───────────────────────────────────────────────────
export const GET  = withAuth(getHandler);
export const POST = withRateLimit(
  RATE_LIMIT_PRESETS.api,
  withAuth(postHandler) as any
);