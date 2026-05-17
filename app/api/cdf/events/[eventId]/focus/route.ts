// // app/api/cdf/events/[eventId]/focus/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { withAuthAndId } from "@/middlewares/validateObjectId";
// import {
//   submitFocusScore,
//   isCdfEnabled,
//   resolveCdfError,
// } from "@/services/cdfService";
// import { z } from "zod";
// import type { AccessTokenPayload } from "@/types/auth";

// export const runtime = "nodejs";

// // ─── Validation ───────────────────────────────────────────────────────────────
// const FocusSchema = z.object({
//   focusScore: z
//     .number()
//     .min(0,   "Focus score must be at least 0")
//     .max(100, "Focus score must be at most 100")
//     .int("Focus score must be a whole number"),
// }).strict();

// // ─── PATCH /api/cdf/events/:eventId/focus ────────────────────────────────────
// const handler = async (
//   req:  NextRequest,
//   ctx:  { params: Record<string, string> },
//   user: AccessTokenPayload
// ): Promise<NextResponse> => {
//   try {
//     // 1. Check CDF enabled
//     const enabled = await isCdfEnabled(user.userId);
//     if (!enabled) {
//       return NextResponse.json(
//         { error: "CDF tracking is disabled." },
//         { status: 403 }
//       );
//     }

//     // 2. Parse + validate
//     const body = await req.json().catch(() => null);
//     if (!body) {
//       return NextResponse.json(
//         { error: "Invalid request body." },
//         { status: 400 }
//       );
//     }

//     const parsed = FocusSchema.safeParse(body);
//     if (!parsed.success) {
//       return NextResponse.json(
//         {
//           error:  "Validation failed.",
//           fields: parsed.error.flatten().fieldErrors,
//         },
//         { status: 422 }
//       );
//     }

//     // 3. Submit focus score
//     const event = await submitFocusScore(
//       user.userId,
//       ctx.params.eventId,
//       { focusScore: parsed.data.focusScore }
//     );

//     return NextResponse.json({ data: event }, { status: 200 });
//   } catch (err) {
//     const { status, message } = resolveCdfError(err);
//     return NextResponse.json({ error: message }, { status });
//   }
// };

// export const PATCH = withAuthAndId("eventId", handler);


// app/api/cdf/events/[eventId]/focus/route.ts
import { NextRequest, NextResponse }  from "next/server";
import { withAuthAndId }              from "@/middlewares/validateObjectId";
import {
  submitFocusScore,
  isCdfEnabled,
  resolveCdfError,
}                                     from "@/services/cdfService";
import { z }                          from "zod";
import type { AccessTokenPayload }    from "@/types/auth";

export const runtime = "nodejs";

// ─── Validation ───────────────────────────────────────────────────────────────
const FocusSchema = z.object({
  focusScore: z
    .number()
    .min(0,   "Focus score must be at least 0")
    .max(100, "Focus score must be at most 100")
    .int("Focus score must be a whole number"),
}).strict();

// ─── PATCH /api/cdf/events/:eventId/focus ────────────────────────────────────
const handler = async (
  req:  NextRequest,
  ctx:  { params: Promise<Record<string, string>> },  // ← Promise in Next.js 16
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    // ── Resolve params — Next.js 16 requires await ──────────────────────────
    const resolvedParams = await ctx.params;
    const eventId        = resolvedParams.eventId;

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing eventId parameter." },
        { status: 400 }
      );
    }

    // ── Check CDF enabled ───────────────────────────────────────────────────
    const enabled = await isCdfEnabled(user.userId);
    if (!enabled) {
      return NextResponse.json(
        { error: "CDF tracking is disabled." },
        { status: 403 }
      );
    }

    // ── Parse + validate body ───────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const parsed = FocusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:  "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // ── Submit focus score ──────────────────────────────────────────────────
    const event = await submitFocusScore(
      user.userId,
      eventId,                          // ← from resolvedParams, not ctx.params
      { focusScore: parsed.data.focusScore }
    );

    return NextResponse.json({ data: event }, { status: 200 });
  } catch (err) {
    const { status, message } = resolveCdfError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

export const PATCH = withAuthAndId("eventId", handler);