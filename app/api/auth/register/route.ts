// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMIT_PRESETS } from "@/middlewares/rateLimit";
import { registerUser, resolveAuthError } from "@/services/authService";
import { z } from "zod";

// ─── Validation schema ────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .trim(),
  email: z
    .string()
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ─── Handler ──────────────────────────────────────────────────────────────────
const handler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // 1. Parse body
    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Register: Failed to parse JSON body:", err);
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    // 2. Validate
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Register: Validation failed:", parsed.error.flatten().fieldErrors);
      return NextResponse.json(
        {
          error: "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // 3. Register
    const result = await registerUser(parsed.data);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    // Log the actual error for debugging
    console.error("Register: Unexpected error:", err);
    
    // Handle different types of errors
    if (err instanceof Error) {
      // Check if it's a known auth error
      const authError = resolveAuthError(err);
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }
    
    // For unknown errors, return generic 500
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
};

export const POST = withRateLimit(RATE_LIMIT_PRESETS.auth, handler);