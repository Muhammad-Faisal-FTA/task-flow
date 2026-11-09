import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withFeatureAuth } from "@/middlewares/authMiddleware";
import type { AccessTokenPayload } from "@/types/auth";
import { resolveSharingError, shareTask } from "@/services/sharingService";

export const runtime = "nodejs";

const ShareTaskSchema = z.object({
  taskId: z.string().uuid(),
  recipientId: z.string().uuid(),
}).strict();

const postHandler = async (
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
  user: AccessTokenPayload,
) => {
  try {
    const body = await request.json().catch(() => null);
    const parsed = ShareTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }
    const share = await shareTask(user.userId, parsed.data.taskId, parsed.data.recipientId);
    return NextResponse.json({ data: share }, { status: 201 });
  } catch (error) {
    const { status, message } = resolveSharingError(error);
    return NextResponse.json({ error: message }, { status });
  }
};

export const POST = withFeatureAuth("tasks", postHandler);
