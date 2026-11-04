import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/middlewares/authMiddleware";
import { getAdminSnapshot, setGlobalService, setUserFeature, updateUserRole } from "@/services/accessControlService";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const ChangeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("service"), service: z.enum(["email", "push"]), enabled: z.boolean() }).strict(),
  z.object({ action: z.literal("feature"), userId: z.string().uuid(), feature: z.enum(["tasks", "lists", "cdf", "notifications"]), enabled: z.boolean() }).strict(),
  z.object({ action: z.literal("role"), userId: z.string().uuid(), role: z.enum(["user", "admin"]) }).strict(),
]);

async function isAdmin(userId: string): Promise<boolean> {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  return user?.role === "admin";
}

export const GET = withAuth(async (_request, _context, user) => {
  if (!(await isAdmin(user.userId))) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  return NextResponse.json(await getAdminSnapshot());
});

export const PATCH = withAuth(async (request: NextRequest, _context, user) => {
  if (!(await isAdmin(user.userId))) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const parsed = ChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid admin change.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  const change = parsed.data;

  if (change.action === "service") await setGlobalService(change.service, change.enabled);
  if (change.action === "feature") {
    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, change.userId)).limit(1);
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
    await setUserFeature(change.userId, change.feature, change.enabled);
  }
  if (change.action === "role") {
    if (change.userId === user.userId && change.role !== "admin") return NextResponse.json({ error: "You cannot remove your own admin access." }, { status: 409 });
    if (!(await updateUserRole(change.userId, change.role))) return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  return NextResponse.json(await getAdminSnapshot());
});
