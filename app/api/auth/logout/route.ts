// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/lib/jwt";
import { withAuth } from "@/middlewares/authMiddleware";
import type { AccessTokenPayload } from "@/types/auth";

// ─── Handler ──────────────────────────────────────────────────────────────────
// Protected — user must have valid access token to logout
// This prevents logout CSRF attacks
const handler = async (
  _req: NextRequest,
  _ctx: { params: Record<string, string> },
  _user: AccessTokenPayload
): Promise<NextResponse> => {
  // Clear the httpOnly refresh token cookie
  // Access token is short-lived (15min) — client discards it from memory
  const response = NextResponse.json(
    { message: "Logged out successfully." },
    { status: 200 }
  );

  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,           // Expire immediately
    path: "/api/auth",
  });

  return response;
};

export const POST = withAuth(handler);