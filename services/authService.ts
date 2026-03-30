// services/authService.ts

import { connectDB } from "@/lib/mongoose";
import { UserModel } from "@/models/user.model";
import {
  signAccessToken,
  signRefreshToken,
  signEmailToken,
  verifyRefreshToken,
  verifyEmailToken,
} from "@/lib/jwt";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/mailer";
import type { AuthResponse, AuthTokens } from "@/types/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Builds the safe user object returned to the client
function buildAuthResponse(
  user: { _id: unknown; name: string; email: string; isVerified: boolean },
  tokens: AuthTokens
): AuthResponse {
  return {
    user: {
      id:         user._id as string,
      name:       user.name,
      email:      user.email,
      isVerified: user.isVerified,
    },
    tokens,
  };
}

// ─── Register ─────────────────────────────────────────────────────────────────
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export async function registerUser(
  payload: RegisterPayload
): Promise<{ message: string }> {
  try {
    await connectDB();

    // 1. Check duplicate email
    const existing = await UserModel.findOne({ email: payload.email.toLowerCase() });
    if (existing) {
      throw new Error("EMAIL_TAKEN");
    }

    // 2. Create user — password hashed in pre-save hook (models/User.ts)
    const user = await UserModel.create({
      name:  payload.name.trim(),
      email: payload.email.toLowerCase(),
      password: payload.password,
    });

    // 3. Generate email verification token
    const verifyToken = signEmailToken(
      { userId: user._id.toString(), email: user.email },
      "email_verify"
    );

    // 4. Store token on user
    user.emailVerifyToken = verifyToken;
    await user.save();

    // 5. Send verification email (non-blocking — don't await in prod if you want faster response)
    try {
      await sendVerificationEmail(user.email, user.name, verifyToken);
    } catch (emailError) {
      console.error("Register: Failed to send verification email:", emailError);
      // Don't throw here - user is still registered, they just need to request a new verification email
    }

    return { message: "Registration successful. Please check your email to verify your account." };
  } catch (err) {
    console.error("Register: Database operation failed:", err);
    throw err;
  }
}

// ─── Verify Email ─────────────────────────────────────────────────────────────
export async function verifyEmail(
  token: string
): Promise<{ message: string }> {
  await connectDB();

  // 1. Verify the token
  const result = verifyEmailToken(token, "email_verify");

  if (!result.success) {
    throw new Error(
      result.error === "expired" ? "VERIFY_TOKEN_EXPIRED" : "VERIFY_TOKEN_INVALID"
    );
  }

  // 2. Find user — select emailVerifyToken explicitly (select:false in schema)
  const user = await UserModel.findById(result.payload.userId).select(
    "+emailVerifyToken"
  );

  if (!user) throw new Error("USER_NOT_FOUND");

  // 3. Guard: already verified
  if (user.isVerified) {
    return { message: "Email already verified. You can log in." };
  }

  // 4. Guard: token mismatch (already used / rotated)
  if (user.emailVerifyToken !== token) {
    throw new Error("VERIFY_TOKEN_INVALID");
  }

  // 5. Mark verified + clear token
  user.isVerified        = true;
  user.emailVerifyToken  = null;
  await user.save();

  return { message: "Email verified successfully. You can now log in." };
}

// ─── Login ────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export async function loginUser(
  payload: LoginPayload
): Promise<AuthResponse> {
  await connectDB();

  // 1. Find user — explicitly select password (select:false in schema)
  const user = await UserModel.findOne({
    email: payload.email.toLowerCase(),
  }).select("+password");

  // 2. Generic error — don't reveal whether email exists (security)
  if (!user) throw new Error("INVALID_CREDENTIALS");

  // 3. Compare password
  const isMatch = await user.comparePassword(payload.password);
  if (!isMatch) throw new Error("INVALID_CREDENTIALS");

  // 4. Block unverified users
  if (!user.isVerified) throw new Error("EMAIL_NOT_VERIFIED");

  // 5. Sign tokens
  const userId = user._id.toString();
  const accessToken  = signAccessToken({ userId, email: user.email });
  const refreshToken = signRefreshToken({ userId });

  return buildAuthResponse(user, { accessToken, refreshToken });
}

// ─── Refresh Tokens ───────────────────────────────────────────────────────────
export async function refreshTokens(
  refreshToken: string
): Promise<AuthTokens> {
  await connectDB();

  // 1. Verify refresh token
  const result = verifyRefreshToken(refreshToken);

  if (!result.success) {
    throw new Error(
      result.error === "expired" ? "REFRESH_TOKEN_EXPIRED" : "REFRESH_TOKEN_INVALID"
    );
  }

  // 2. Confirm user still exists (could be deleted after token issued)
  const user = await UserModel.findById(result.payload.userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  // 3. Issue fresh token pair
  const userId       = user._id.toString();
  const accessToken  = signAccessToken({ userId, email: user.email });
  const newRefresh   = signRefreshToken({ userId });

  return { accessToken, refreshToken: newRefresh };
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export async function forgotPassword(
  email: string
): Promise<{ message: string }> {
  await connectDB();

  const user = await UserModel.findOne({ email: email.toLowerCase() });

  // Always return same message — don't reveal if email exists (security)
  const genericMessage =
    "If that email is registered, a reset link has been sent.";

  if (!user || !user.isVerified) return { message: genericMessage };

  // 1. Generate reset token
  const resetToken = signEmailToken(
    { userId: user._id.toString(), email: user.email },
    "password_reset"
  );

  // 2. Store token + expiry (1 hour from now)
  user.resetPasswordToken  = resetToken;
  user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1hr
  await user.save();

  // 3. Send email
  await sendPasswordResetEmail(user.email, user.name, resetToken);

  return { message: genericMessage };
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  await connectDB();

  // 1. Verify token
  const result = verifyEmailToken(token, "password_reset");

  if (!result.success) {
    throw new Error(
      result.error === "expired" ? "RESET_TOKEN_EXPIRED" : "RESET_TOKEN_INVALID"
    );
  }

  // 2. Find user — select token fields (select:false in schema)
  const user = await UserModel.findById(result.payload.userId).select(
    "+resetPasswordToken +resetPasswordExpiry"
  );

  if (!user) throw new Error("USER_NOT_FOUND");

  // 3. Token mismatch (already used)
  if (user.resetPasswordToken !== token) {
    throw new Error("RESET_TOKEN_INVALID");
  }

  // 4. Expiry check (double check — JWT already checks but DB is source of truth)
  if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
    throw new Error("RESET_TOKEN_EXPIRED");
  }

  // 5. Set new password — pre-save hook will hash it
  user.password            = newPassword;
  user.resetPasswordToken  = null;
  user.resetPasswordExpiry = null;
  await user.save();

  return { message: "Password reset successful. You can now log in." };
}

// ─── Error code → HTTP message map (used in API routes) ──────────────────────
export const AUTH_ERRORS: Record<string, { status: number; message: string }> = {
  EMAIL_TAKEN:            { status: 409, message: "An account with this email already exists." },
  INVALID_CREDENTIALS:    { status: 401, message: "Invalid email or password." },
  EMAIL_NOT_VERIFIED:     { status: 403, message: "Please verify your email before logging in." },
  USER_NOT_FOUND:         { status: 404, message: "User not found." },
  VERIFY_TOKEN_EXPIRED:   { status: 410, message: "Verification link has expired. Please register again." },
  VERIFY_TOKEN_INVALID:   { status: 400, message: "Invalid verification link." },
  REFRESH_TOKEN_EXPIRED:  { status: 401, message: "Session expired. Please log in again." },
  REFRESH_TOKEN_INVALID:  { status: 401, message: "Invalid session. Please log in again." },
  RESET_TOKEN_EXPIRED:    { status: 410, message: "Reset link has expired. Please request a new one." },
  RESET_TOKEN_INVALID:    { status: 400, message: "Invalid reset link." },
};

// ─── Helper used in API routes ─────────────────────────────────────────────────
export function resolveAuthError(err: unknown): { status: number; message: string } {
  const code = err instanceof Error ? err.message : "UNKNOWN";
  return AUTH_ERRORS[code] ?? { status: 500, message: "Something went wrong. Please try again." };
}