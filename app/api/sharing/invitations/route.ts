import { NextRequest, NextResponse } from "next/server";
import { withFeatureAuth } from "@/middlewares/authMiddleware";
import type { AccessTokenPayload } from "@/types/auth";
import { getPendingTaskShares, resolveSharingError } from "@/services/sharingService";

export const runtime = "nodejs";

const getHandler = async (
  _request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
  user: AccessTokenPayload,
) => {
  try {
    return NextResponse.json({ data: await getPendingTaskShares(user.userId) });
  } catch (error) {
    const { status, message } = resolveSharingError(error);
    return NextResponse.json({ error: message }, { status });
  }
};

export const GET = withFeatureAuth("tasks", getHandler);
