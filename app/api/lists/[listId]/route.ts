// app/api/lists/[listId]/route.ts
// GET    /api/lists/:listId  — get single list
// PATCH  /api/lists/:listId  — rename or recolor list
// DELETE /api/lists/:listId  — delete list

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuthAndId } from "@/middlewares/validateObjectId";
import {
  getUserLists,
  updateList,
  deleteList,
  resolveTaskError,
} from "@/services/taskService";
import type { AccessTokenPayload } from "@/types/auth";

export const runtime = "nodejs";

// ─── Validation schema ────────────────────────────────────────────────────────
const UpdateListSchema = z
  .object({
    name: z
      .string()
      .min(1,  "List name cannot be empty")
      .max(50, "List name must be at most 50 characters")
      .trim()
      .optional(),

    color: z
      .string()
      .regex(
        /^#[0-9A-Fa-f]{6}$/,
        "Color must be a valid hex color e.g. #1E8BC3"
      )
      .optional(),
  })
  .strict()
  .refine(
    (data) => data.name !== undefined || data.color !== undefined,
    { message: "At least one field (name or color) must be provided." }
  );

// ─── GET /api/lists/:listId ───────────────────────────────────────────────────
// Returns single list with live counts
// Reuses getUserLists and filters — avoids separate DB query
const getHandler = async (
  _req: NextRequest,
  ctx:  { params: Promise<Record<string, string>> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const { listId } = await ctx.params;
    const lists = await getUserLists(user.userId);
    const list  = lists.find((l) => l.id === listId);

    if (!list) {
      return NextResponse.json(
        { error: "List not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: list }, { status: 200 });
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── PATCH /api/lists/:listId ─────────────────────────────────────────────────
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
    const parsed = UpdateListSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:  "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // 3. Update
    const { listId } = await ctx.params;
    const list = await updateList(
      user.userId,
      listId,
      parsed.data
    );

    return NextResponse.json({ data: list }, { status: 200 });
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── DELETE /api/lists/:listId ────────────────────────────────────────────────
const deleteHandler = async (
  _req: NextRequest,
  ctx:  { params: Promise<Record<string, string>> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const { listId } = await ctx.params;
    const result = await deleteList(user.userId, listId);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── Export with middleware ───────────────────────────────────────────────────
export const GET    = withAuthAndId("listId", getHandler);
export const PATCH  = withAuthAndId("listId", patchHandler);
export const DELETE = withAuthAndId("listId", deleteHandler);