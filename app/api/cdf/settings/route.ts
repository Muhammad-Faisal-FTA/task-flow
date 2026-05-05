// app/api/cdf/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middlewares/authMiddleware";
import {
  getCdfSettings,
  updateCdfSettings,
  resolveCdfError,
} from "@/services/cdfService";
import { z } from "zod";
import type { AccessTokenPayload } from "@/types/auth";

export const runtime = "nodejs";

// ─── GET /api/cdf/settings ────────────────────────────────────────────────────
const getHandler = async (
  _req: NextRequest,
  _ctx: { params: Record<string, string> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const settings = await getCdfSettings(user.userId);
    return NextResponse.json({ data: settings }, { status: 200 });
  } catch (err) {
    const { status, message } = resolveCdfError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// ─── PATCH /api/cdf/settings ──────────────────────────────────────────────────
const UpdateSettingsSchema = z.object({
  enabled: z.boolean(),
}).strict();

const patchHandler = async (
  req:  NextRequest,
  _ctx: { params: Record<string, string> },
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

    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:  "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const settings = await updateCdfSettings(
      user.userId,
      parsed.data.enabled
    );

    return NextResponse.json({ data: settings }, { status: 200 });
  } catch (err) {
    const { status, message } = resolveCdfError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

export const GET   = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);