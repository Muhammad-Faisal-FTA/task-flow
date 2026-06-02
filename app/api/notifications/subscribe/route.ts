// app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth }                  from "@/middlewares/authMiddleware";
import {
  saveSubscription,
  removeSubscription,
} from "@/services/notificationService";
import { z }                         from "zod";
import type { AccessTokenPayload }   from "@/types/auth";

export const runtime = "nodejs";

// ─── Validation ───────────────────────────────────────────────────────────────
const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth:   z.string().min(1),
  }),
}).strict();

// ─── POST /api/notifications/subscribe ───────────────────────────────────────
const postHandler = async (
  req:  NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid subscription data." },
        { status: 422 }
      );
    }

    const userAgent = req.headers.get("user-agent") ?? undefined;

    await saveSubscription(
      user.userId,
      parsed.data,
      userAgent
    );

    return NextResponse.json(
      { message: "Subscribed successfully." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json(
      { error: "Failed to save subscription." },
      { status: 500 }
    );
  }
};

// ─── DELETE /api/notifications/subscribe ─────────────────────────────────────
const deleteHandler = async (
  req:  NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const body = await req.json().catch(() => null);
    const endpoint = body?.endpoint as string | undefined;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint." },
        { status: 400 }
      );
    }

    await removeSubscription(user.userId, endpoint);

    return NextResponse.json(
      { message: "Unsubscribed successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[unsubscribe]", err);
    return NextResponse.json(
      { error: "Failed to remove subscription." },
      { status: 500 }
    );
  }
};

export const POST   = withAuth(postHandler);
export const DELETE = withAuth(deleteHandler);