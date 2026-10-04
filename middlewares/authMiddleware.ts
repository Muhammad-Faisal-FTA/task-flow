// middlewares/authMiddleware.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import type { AccessTokenPayload } from "@/types/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
// The path-specific params shape is supplied by Next when a route is generated.
// Auth wrappers forward it unchanged across both static and dynamic routes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteContext = { params: Promise<any> };

// Route handler that receives verified user payload
export type AuthenticatedHandler = (
  req: NextRequest,
  context: RouteContext,
  user: AccessTokenPayload
) => Promise<NextResponse>;

// ─── Extract token from header ────────────────────────────────────────────────
function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

// ─── withAuth HOC ─────────────────────────────────────────────────────────────
// Wraps any API route handler — injects verified user payload
// Usage:
//   export const GET = withAuth(async (req, ctx, user) => { ... })
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    req: NextRequest,
    context: RouteContext
  ): Promise<NextResponse> => {
    // 1. Extract token
    const token = extractBearerToken(req);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    // 2. Verify token
    const result = verifyAccessToken(token);

    if (!result.success) {
      const message =
        result.error === "expired"
          ? "Session expired. Please log in again."
          : "Invalid token. Please log in again.";

      return NextResponse.json(
        { error: message, code: result.error.toUpperCase() },
        { status: 401 }
      );
    }

    // 3. Call the actual handler with verified user
    return handler(req, context, result.payload);
  };
}

// ─── withOptionalAuth ─────────────────────────────────────────────────────────
// For routes that work both authenticated + unauthenticated
// user will be null if no valid token present
export type OptionalAuthHandler = (
  req: NextRequest,
  context: RouteContext,
  user: AccessTokenPayload | null
) => Promise<NextResponse>;

export function withOptionalAuth(handler: OptionalAuthHandler) {
  return async (
    req: NextRequest,
    context: RouteContext
  ): Promise<NextResponse> => {
    const token = extractBearerToken(req);

    if (!token) return handler(req, context, null);

    const result = verifyAccessToken(token);
    return handler(req, context, result.success ? result.payload : null);
  };
}