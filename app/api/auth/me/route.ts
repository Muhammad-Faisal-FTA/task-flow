// app/api/auth/me/route.ts
// Returns the current user's profile — used on bootstrap to restore session

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middlewares/authMiddleware";
import { connectDB } from "@/lib/mongoose";
import { UserModel } from "@/models/user.model";
import type { AccessTokenPayload } from "@/types/auth";

const handler = async (
  _req: NextRequest,
  _ctx: { params: Record<string, string> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  await connectDB();

  const found = await UserModel.findById(user.userId).lean();
  if (!found) {
    return NextResponse.json(
      { error: "User not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    user: {
      id:         found._id.toString(),
      name:       found.name,
      email:      found.email,
      isVerified: found.isVerified,
    },
  });
};

export const GET = withAuth(handler);