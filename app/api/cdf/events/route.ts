/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cdf/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middlewares/authMiddleware";
import { withRateLimit, RATE_LIMIT_PRESETS } from "@/middlewares/rateLimit";
import {
  getCdfEvents,
  createCdfEvent,
  isCdfEnabled,
  resolveCdfError,
} from "@/services/cdfService";
import { z } from "zod";
import { isValidObjectId } from "@/middlewares/validateObjectId";
import type { AccessTokenPayload } from "@/types/auth";

export const runtime = "nodejs";

// ─── GET /api/cdf/events ──────────────────────────────────────────────────────
const getHandler = async (
  req:  NextRequest,
  _ctx: { params: Record<string, string> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const limit = parseInt(
      req.nextUrl.searchParams.get("limit") ?? "50"
    );

    const groups = await getCdfEvents(
      user.userId,
      Math.min(Math.max(limit, 1), 100) // clamp 1–100
    );

    return NextResponse.json({ data: groups }, { status: 200 });
  } catch (err) {
    const { status, message } = resolveCdfError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── POST /api/cdf/events ─────────────────────────────────────────────────────
const CreateEventSchema = z.object({
  taskId:    z.string().refine(isValidObjectId, "Invalid taskId"),
  taskTitle: z.string().min(1).max(255).trim(),
  listId:    z.string().refine(isValidObjectId, "Invalid listId"),
  repeat:    z.enum([
    "none", "daily", "weekdays", "weekly", "monthly", "yearly"
  ]),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
    .nullable()
    .optional(),
  dueTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "dueTime must be HH:MM")
    .nullable()
    .optional(),
}).strict();

const postHandler = async (
  req:  NextRequest,
  _ctx: { params: Record<string, string> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    // 1. Check CDF is enabled — don't create events if turned off
    const enabled = await isCdfEnabled(user.userId);
    if (!enabled) {
      return NextResponse.json(
        { error: "CDF tracking is disabled." },
        { status: 403 }
      );
    }

    // 2. Parse + validate body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const parsed = CreateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:  "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // 3. Create event
    const event = await createCdfEvent(user.userId, {
      taskId:    parsed.data.taskId,
      taskTitle: parsed.data.taskTitle,
      listId:    parsed.data.listId,
      repeat:    parsed.data.repeat,
      dueDate:   parsed.data.dueDate ?? null,
      dueTime:   parsed.data.dueTime ?? null,
    });

    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err) {
    const { status, message } = resolveCdfError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

export const GET  = withAuth(getHandler);
export const POST = withRateLimit(
  RATE_LIMIT_PRESETS.api,
  withAuth(postHandler) as any
);