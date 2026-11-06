// app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMIT_PRESETS } from "@/middlewares/rateLimit";
import { forgotPassword, resolveAuthError } from "@/services/authService";
import { z } from "zod";

// ─── Validation schema ────────────────────────────────────────────────────────
const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .toLowerCase(),
});

function getDatabaseErrorDetails(error: unknown): Record<string, string> {
  if (!(error instanceof Error)) return { errorType: typeof error };

  const details: Record<string, string> = { errorName: error.name };
  if ("code" in error && typeof error.code === "string") {
    details.errorCode = error.code;
  }
  if ("column" in error && typeof error.column === "string") {
    details.column = error.column;
  }
  if ("table" in error && typeof error.table === "string") {
    details.table = error.table;
  }
  return details;
}

function isMissingResetOtpSchema(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const code = "code" in error ? error.code : undefined;
  const message = error.message.toLowerCase();
  const missingColumn = code === "42703" || message.includes("does not exist");
  return missingColumn && /reset_password_otp_(hash|expiry)/.test(message);
}

// ─── Handler ──────────────────────────────────────────────────────────────────
const handler = async (req: NextRequest): Promise<NextResponse> => {
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
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // 3. Process — always returns same message (security: don't reveal email existence)
    const result = await forgotPassword(parsed.data.email);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error(
      "[POST /api/auth/forgot-password] Request failed",
      getDatabaseErrorDetails(err),
    );

    if (isMissingResetOtpSchema(err)) {
      return NextResponse.json(
        {
          error:
            "Password reset is temporarily unavailable because the database needs an update. Please contact support.",
        },
        { status: 503 },
      );
    }

    const { status, message } = resolveAuthError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// Very strict rate limit — 3 requests per hour (NFR Security)
export const POST = withRateLimit(RATE_LIMIT_PRESETS.forgotPassword, handler);
