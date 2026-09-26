// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMIT_PRESETS } from "@/middlewares/rateLimit";
import { loginUser, resolveAuthError } from "@/services/authService";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/jwt";
import { z } from "zod";

// ─── Validation schema ────────────────────────────────────────────────────────
const LoginSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required"),
});

// ─── Handler ──────────────────────────────────────────────────────────────────
const handler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    console.log("Login attempt at", new Date().toISOString());
    // 1. Parse body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 2. Validate
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // 3. Login
    const { user, tokens } = await loginUser(parsed.data);

    // 4. Set refresh token in httpOnly cookie
    const response = NextResponse.json(
      {
        user,
        accessToken: tokens.accessToken,
      },
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
    return NextResponse.json({ error: message }, { status });
  }
};

export const POST = withRateLimit(RATE_LIMIT_PRESETS.auth, handler);