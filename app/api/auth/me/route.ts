// app/api/auth/me/route.ts
// Returns the current user's profile — used on bootstrap to restore session

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middlewares/authMiddleware";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { AccessTokenPayload } from "@/types/auth";

const handler = async (
  _req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  const found = (await db.select().from(users).where(eq(users.id, user.userId)).limit(1))[0];
  if (!found) {
    return NextResponse.json(
      { error: "User not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    user: {
      id:         found.id,
      name:       found.name,
      email:      found.email,
      isVerified: found.isVerified,
    },
  });
};

export const GET = withAuth(handler);
