import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminFeatures, platformSettings, thirdPartyServices, userPermissions, users } from "@/db/schema";

export type AdminFeature = (typeof adminFeatures)[number];
export type ThirdPartyService = (typeof thirdPartyServices)[number];
const knownFeatures = new Set<string>(adminFeatures);
const knownServices = new Set<string>(thirdPartyServices);

/** Checks persisted user role and explicit feature overrides for each request. */
export async function canAccessFeature(userId: string, feature: AdminFeature): Promise<boolean> {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return false;
  if (user.role === "admin") return true;
  const [grant] = await db.select({ enabled: userPermissions.enabled }).from(userPermissions)
    .where(and(eq(userPermissions.userId, userId), eq(userPermissions.feature, feature))).limit(1);
  return grant?.enabled ?? true;
}

/** Unconfigured integrations remain enabled to preserve existing behavior. */
export async function isServiceEnabled(service: ThirdPartyService, userId?: string): Promise<boolean> {
  const [global] = await db.select({ enabled: platformSettings.enabled }).from(platformSettings)
    .where(eq(platformSettings.service, service)).limit(1);
  if (global?.enabled === false) return false;
  if (!userId) return true;
  return canAccessFeature(userId, "notifications");
}

export async function getAdminSnapshot() {
  const [allUsers, overrides, settings] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, isVerified: users.isVerified, role: users.role }).from(users).orderBy(asc(users.createdAt)),
    db.select({ userId: userPermissions.userId, feature: userPermissions.feature, enabled: userPermissions.enabled }).from(userPermissions),
    db.select({ service: platformSettings.service, enabled: platformSettings.enabled }).from(platformSettings),
  ]);
  return { users: allUsers, permissions: overrides, services: thirdPartyServices.map((service) => ({ service, enabled: settings.find((item) => item.service === service)?.enabled ?? true })) };
}

export async function updateUserRole(userId: string, role: "user" | "admin"): Promise<boolean> {
  const [updated] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId)).returning({ id: users.id });
  return Boolean(updated);
}

export async function setUserFeature(userId: string, feature: string, enabled: boolean): Promise<void> {
  if (!knownFeatures.has(feature)) throw new Error("INVALID_FEATURE");
  await db.insert(userPermissions).values({ userId, feature, enabled, updatedAt: new Date() })
    .onConflictDoUpdate({ target: [userPermissions.userId, userPermissions.feature], set: { enabled, updatedAt: new Date() } });
}

export async function setGlobalService(service: string, enabled: boolean): Promise<void> {
  if (!knownServices.has(service)) throw new Error("INVALID_SERVICE");
  await db.insert(platformSettings).values({ service, enabled, updatedAt: new Date() })
    .onConflictDoUpdate({ target: platformSettings.service, set: { enabled, updatedAt: new Date() } });
}
