import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveAuthError, verifyEmail } from "@/services/authService";
import { RATE_LIMIT_PRESETS, withRateLimit } from "@/middlewares/rateLimit";

const schema = z.object({
  email: z.string().email("A valid email is required").toLowerCase(),
  otp: z.string().regex(/^\d{6}$/, "OTP must contain exactly 6 digits"),
});

const handler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Validation failed.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    return NextResponse.json(await verifyEmail(parsed.data.email, parsed.data.otp));
  } catch (error) {
    const resolved = resolveAuthError(error);
    return NextResponse.json({ error: resolved.message }, { status: resolved.status });
  }
};

export const POST = withRateLimit(RATE_LIMIT_PRESETS.auth, handler);
