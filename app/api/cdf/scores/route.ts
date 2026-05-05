// app/api/cdf/scores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middlewares/authMiddleware";
import {
  getCdfScores,
  resolveCdfError,
} from "@/services/cdfService";
import type { AccessTokenPayload } from "@/types/auth";

export const runtime = "nodejs";

// ─── GET /api/cdf/scores ──────────────────────────────────────────────────────
const getHandler = async (
  _req: NextRequest,
  _ctx: { params: Record<string, string> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const scores = await getCdfScores(user.userId);

    // No scores yet — CDF just enabled, no events yet
    if (!scores) {
      return NextResponse.json(
        {
          data: null,
          message: "No CDF data yet. Complete some tasks to see your scores.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ data: scores }, { status: 200 });
  } catch (err) {
    const { status, message } = resolveCdfError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

export const GET = withAuth(getHandler);