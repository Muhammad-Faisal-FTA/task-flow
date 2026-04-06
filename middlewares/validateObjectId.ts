// middlewares/validateObjectId.ts
// Reusable MongoDB ObjectId validation middleware.
// Prevents invalid IDs from ever reaching the service layer.

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import type { AccessTokenPayload } from "@/types/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
type Params = Record<string, string>;

type HandlerWithId = (
  req:    NextRequest,
  ctx:    { params: Promise<Params> },
  user:   AccessTokenPayload
) => Promise<NextResponse>;

// ─── Single ID validation ─────────────────────────────────────────────────────
/**
 * Validates one param key is a valid MongoDB ObjectId.
 *
 * Usage:
 *   export const GET = withAuth(validateObjectId("taskId", handler));
 */
export function validateObjectId(
  paramKey: string,
  handler:  HandlerWithId
): HandlerWithId {
  return async (
    req:  NextRequest,
    ctx:  { params: Promise<Params> },
    user: AccessTokenPayload
  ): Promise<NextResponse> => {
    const resolvedParams = await ctx.params;
    const id = resolvedParams[paramKey];

    if (!id) {
      return NextResponse.json(
        { error: `Missing required parameter: ${paramKey}.` },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: `Invalid ${paramKey}: must be a valid ID.` },
        { status: 400 }
      );
    }

    return handler(req, ctx, user);
  };
}

// ─── Multiple ID validation ───────────────────────────────────────────────────
/**
 * Validates multiple param keys in one wrapper.
 *
 * Usage:
 *   export const GET = withAuth(
 *     validateObjectIds(["listId", "taskId"], handler)
 *   );
 */
export function validateObjectIds(
  paramKeys: string[],
  handler:   HandlerWithId
): HandlerWithId {
  return async (
    req:  NextRequest,
    ctx:  { params: Promise<Params> },
    user: AccessTokenPayload
  ): Promise<NextResponse> => {
    const resolvedParams = await ctx.params;
    for (const key of paramKeys) {
      const id = resolvedParams[key];

      if (!id) {
        return NextResponse.json(
          { error: `Missing required parameter: ${key}.` },
          { status: 400 }
        );
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: `Invalid ${key}: must be a valid ID.` },
          { status: 400 }
        );
      }
    }

    return handler(req, ctx, user);
  };
}

// ─── Standalone validator (used in service layer directly) ────────────────────
/**
 * Simple boolean check — used in services when ID
 * comes from request body, not URL params.
 *
 * Usage:
 *   if (!isValidObjectId(body.listId)) {
 *     return NextResponse.json({ error: "Invalid listId" }, { status: 400 });
 *   }
 */
export function isValidObjectId(id: unknown): boolean {
  if (typeof id !== "string") return false;
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── Compose: withAuth + validateObjectId ─────────────────────────────────────
/**
 * Convenience — combines withAuth + validateObjectId in one wrapper.
 * Keeps route files minimal.
 *
 * Usage:
 *   export const GET = withAuthAndId("taskId", handler);
 */
import { withAuth } from "@/middlewares/authMiddleware";

export function withAuthAndId(
  paramKey: string,
  handler:  HandlerWithId
) {
  return withAuth(validateObjectId(paramKey, handler));
}

export function withAuthAndIds(
  paramKeys: string[],
  handler:   HandlerWithId
) {
  return withAuth(validateObjectIds(paramKeys, handler));
}