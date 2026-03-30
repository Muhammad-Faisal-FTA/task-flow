// app/api/auth/refresh/route.ts

import { NextRequest, NextResponse } from "next/server";
import { refreshTokens, resolveAuthError } from "@/services/authService";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/jwt";

// ─── Handler ──────────────────────────────────────────────────────────────────
// No rate limit here — refresh is called silently by the client
// It is already protected by the httpOnly cookie + short-lived access token
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Read refresh token from httpOnly cookie
    const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found. Please log in again." },
        { status: 401 }
      );
    }

    // 2. Rotate tokens
    const tokens = await refreshTokens(refreshToken);

    // 3. Set new refresh token cookie + return new access token
    const response = NextResponse.json(
      { accessToken: tokens.accessToken },
      { status: 200 }
    );

    response.cookies.set(
      REFRESH_COOKIE_NAME,
      tokens.refreshToken,
      refreshCookieOptions
    );

    return response;
  } catch (err) {
    const { status, message } = resolveAuthError(err);

    // Clear cookie on invalid/expired refresh token
    const response = NextResponse.json({ error: message }, { status });
    response.cookies.delete(REFRESH_COOKIE_NAME);
    return response;
  }
}