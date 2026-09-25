import bcrypt from "bcryptjs";
import { createHash, randomInt } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signAccessToken, signRefreshToken, signEmailToken, verifyRefreshToken, verifyEmailToken } from "@/lib/jwt";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mailer";
import type { AuthResponse, AuthTokens } from "@/types/auth";
import { createDefaultList } from "@/services/taskService";

type User = typeof users.$inferSelect;
const authResponse = (u: User, tokens: AuthTokens): AuthResponse => ({ user: { id: u.id, name: u.name, email: u.email, isVerified: u.isVerified }, tokens });
export interface RegisterPayload { name: string; email: string; password: string }
export interface LoginPayload { email: string; password: string }
const hashOtp = (otp: string) => createHash("sha256").update(otp).digest("hex");

export async function registerUser(p: RegisterPayload) {
  const email = p.email.toLowerCase();
  if ((await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0]) throw new Error("EMAIL_TAKEN");
  const [user] = await db.insert(users).values({ name: p.name.trim(), email, password: await bcrypt.hash(p.password, 12) }).returning();
  const otp = randomInt(100000, 1000000).toString();
  await db.update(users).set({ verificationOtpHash: hashOtp(otp), verificationOtpExpiry: new Date(Date.now() + 10 * 60_000), updatedAt: new Date() }).where(eq(users.id, user.id));
  await sendVerificationEmail(email, user.name, otp);
  return { message: "Registration successful. Enter the OTP sent to your email." };
}
export async function verifyEmail(email: string, otp: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.isVerified) return { message: "Email already verified. You can log in." };
  if (!user.verificationOtpExpiry || user.verificationOtpExpiry < new Date()) throw new Error("VERIFY_TOKEN_EXPIRED");
  if (!user.verificationOtpHash || user.verificationOtpHash !== hashOtp(otp)) throw new Error("VERIFY_TOKEN_INVALID");
  await db.update(users).set({ isVerified: true, verificationOtpHash: null, verificationOtpExpiry: null, updatedAt: new Date() }).where(eq(users.id, user.id));
  await createDefaultList(user.id);
  return { message: "Email verified successfully. You can now log in." };
}
export async function loginUser(p: LoginPayload): Promise<AuthResponse> {
  const [user] = await db.select().from(users).where(eq(users.email, p.email.toLowerCase())).limit(1);
  if (!user || !(await bcrypt.compare(p.password, user.password))) throw new Error("INVALID_CREDENTIALS");
  if (!user.isVerified) throw new Error("EMAIL_NOT_VERIFIED");
  return authResponse(user, { accessToken: signAccessToken({ userId: user.id, email: user.email }), refreshToken: signRefreshToken({ userId: user.id }) });
}
export async function refreshTokens(token: string): Promise<AuthTokens> {
  const result = verifyRefreshToken(token);
  if (!result.success) throw new Error(result.error === "expired" ? "REFRESH_TOKEN_EXPIRED" : "REFRESH_TOKEN_INVALID");
  const [user] = await db.select().from(users).where(eq(users.id, result.payload.userId)).limit(1);
  if (!user) throw new Error("USER_NOT_FOUND");
  return { accessToken: signAccessToken({ userId: user.id, email: user.email }), refreshToken: signRefreshToken({ userId: user.id }) };
}
export async function forgotPassword(email: string) {
  const message = "If that email is registered, a reset link has been sent.";
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user?.isVerified) return { message };
  const token = signEmailToken({ userId: user.id, email: user.email }, "password_reset");
  await db.update(users).set({ resetPasswordToken: token, resetPasswordExpiry: new Date(Date.now() + 3_600_000), updatedAt: new Date() }).where(eq(users.id, user.id));
  await sendPasswordResetEmail(user.email, user.name, token);
  return { message };
}
export async function resetPassword(token: string, password: string) {
  const result = verifyEmailToken(token, "password_reset");
  if (!result.success) throw new Error(result.error === "expired" ? "RESET_TOKEN_EXPIRED" : "RESET_TOKEN_INVALID");
  const [user] = await db.select().from(users).where(eq(users.id, result.payload.userId)).limit(1);
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.resetPasswordToken !== token) throw new Error("RESET_TOKEN_INVALID");
  if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) throw new Error("RESET_TOKEN_EXPIRED");
  await db.update(users).set({ password: await bcrypt.hash(password, 12), resetPasswordToken: null, resetPasswordExpiry: null, updatedAt: new Date() }).where(eq(users.id, user.id));
  return { message: "Password reset successful. You can now log in." };
}
export const AUTH_ERRORS: Record<string, { status: number; message: string }> = {
  EMAIL_TAKEN: { status: 409, message: "An account with this email already exists." }, INVALID_CREDENTIALS: { status: 401, message: "Invalid email or password." }, EMAIL_NOT_VERIFIED: { status: 403, message: "Please verify your email before logging in." }, USER_NOT_FOUND: { status: 404, message: "User not found." }, VERIFY_TOKEN_EXPIRED: { status: 410, message: "Verification link expired." }, VERIFY_TOKEN_INVALID: { status: 400, message: "Invalid verification link." }, REFRESH_TOKEN_EXPIRED: { status: 401, message: "Session expired." }, REFRESH_TOKEN_INVALID: { status: 401, message: "Invalid session." }, RESET_TOKEN_EXPIRED: { status: 410, message: "Reset link expired." }, RESET_TOKEN_INVALID: { status: 400, message: "Invalid reset link." }, EMAIL_DELIVERY_FAILED: { status: 503, message: "We could not send the email right now. Please try again later." },
};
export function resolveAuthError(error: unknown) { return AUTH_ERRORS[error instanceof Error ? error.message : "UNKNOWN"] ?? { status: 500, message: "Something went wrong. Please try again." }; }
