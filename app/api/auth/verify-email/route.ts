// app/api/auth/verify-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyEmail, resolveAuthError } from "@/services/authService";
import { z } from "zod";

// ─── Validation schema ────────────────────────────────────────────────────────
const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

// ─── Handler ──────────────────────────────────────────────────────────────────
// GET /api/auth/verify-email?token=xxx
// Called when user clicks the link in their email
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Extract token from query param
    const token = req.nextUrl.searchParams.get("token");

    const parsed = VerifyEmailSchema.safeParse({ token });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Verification token is missing or invalid." },
        { status: 400 }
      );
    }

    // 2. Verify
    const result = await verifyEmail(parsed.data.token);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { status, message } = resolveAuthError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

// ─── POST variant ─────────────────────────────────────────────────────────────
// Allows client to verify via JSON body too (for programmatic use)
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const parsed = VerifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const result = await verifyEmail(parsed.data.token);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { status, message } = resolveAuthError(err);
    return NextResponse.json({ error: message }, { status });
  }
}