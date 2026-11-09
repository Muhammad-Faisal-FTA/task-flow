import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withFeatureAuth } from "@/middlewares/authMiddleware";
import type { AccessTokenPayload } from "@/types/auth";
import { getShareAllowList, resolveSharingError, updateShareAllowList } from "@/services/sharingService";

export const runtime = "nodejs";

const UpdateAllowListSchema = z.object({
  userIds: z.array(z.string().uuid()).max(500),
}).strict().refine(({ userIds }) => new Set(userIds).size === userIds.length, {
  path: ["userIds"],
  message: "Users must not be repeated.",
});

const getHandler = async (
  _request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
  user: AccessTokenPayload,
) => {
  try {
    return NextResponse.json({ data: await getShareAllowList(user.userId) });
  } catch (error) {
    const { status, message } = resolveSharingError(error);
    return NextResponse.json({ error: message }, { status });
  }
};

const patchHandler = async (
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
  user: AccessTokenPayload,
) => {
  try {
    const body = await request.json().catch(() => null);
    const parsed = UpdateAllowListSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }
    return NextResponse.json({ data: await updateShareAllowList(user.userId, parsed.data.userIds) });
  } catch (error) {
    const { status, message } = resolveSharingError(error);
    return NextResponse.json({ error: message }, { status });
  }
};

export const GET = withFeatureAuth("tasks", getHandler);
export const PATCH = withFeatureAuth("tasks", patchHandler);
