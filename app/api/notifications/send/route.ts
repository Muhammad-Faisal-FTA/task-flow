// // app/api/notifications/send/route.ts
// // Called by your cron job every minute
// // Protected by CRON_SECRET — not authenticated via JWT

// import { NextRequest, NextResponse } from "next/server";
// import { sendAtTimeReminders }       from "@/services/notificationService";

// export const runtime = "nodejs";

// export async function GET(req: NextRequest): Promise<NextResponse> {
//   try {
//     // ── Verify cron secret ────────────────────────────────────────────────────
//     const authHeader = req.headers.get("authorization");
//     const cronSecret = process.env.CRON_SECRET;

//     if (!cronSecret) {
//       console.error("[send-notifications] CRON_SECRET not set");
//       return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
//     }

//     if (authHeader !== `Bearer ${cronSecret}`) {
//       return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
//     }

//     // ── Run notifications ──────────────────────────────────────────────────────
//     const windowMinutes = parseInt(
//       req.nextUrl.searchParams.get("window") ?? "5"
//     );

//     const result = await sendAtTimeReminders(windowMinutes);

//     return NextResponse.json(
//       {
//         success: true,
//         ...result,
//         timestamp: new Date().toISOString(),
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("[send-notifications]", err);
//     return NextResponse.json(
//       { error: "Failed to send notifications." },
//       { status: 500 }
//     );
//   }
// }


// app/api/notifications/send/route.ts
// Called by your cron job every minute
// Protected by CRON_SECRET — not authenticated via JWT

import { NextRequest, NextResponse } from "next/server";
import { sendAtTimeReminders }       from "@/services/notificationService";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // ── Verify cron secret ────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[send-notifications] CRON_SECRET not set");
      return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // ── Run notifications ──────────────────────────────────────────────────────
    const windowMinutes = parseInt(
      req.nextUrl.searchParams.get("window") ?? "5"
    );

    const result = await sendAtTimeReminders(windowMinutes);

    return NextResponse.json(
      {
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[send-notifications]", err);
    return NextResponse.json(
      { error: "Failed to send notifications." },
      { status: 500 }
    );
  }
}