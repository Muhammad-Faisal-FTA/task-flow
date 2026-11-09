import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withFeatureAuth } from "@/middlewares/authMiddleware";
import type { AccessTokenPayload } from "@/types/auth";
import { resolveSharingError, respondToTaskShare } from "@/services/sharingService";

export const runtime = "nodejs";

const ResponseSchema = z.object({
  action: z.enum(["accept", "decline"]),
}).strict();

const patchHandler = async (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  user: AccessTokenPayload,
) => {
  try {
    const { shareId } = await context.params;
    if (!z.string().uuid().safeParse(shareId).success) {
      return NextResponse.json({ error: "Invalid invitation ID." }, { status: 400 });
    }
    const body = await request.json().catch(() => null);
    const parsed = ResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }
    return NextResponse.json({ data: await respondToTaskShare(user.userId, shareId, parsed.data.action) });
  } catch (error) {
    const { status, message } = resolveSharingError(error);
    return NextResponse.json({ error: message }, { status });
  }
};

export const PATCH = withFeatureAuth("tasks", patchHandler);
