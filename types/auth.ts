// types/auth.ts

import { Types } from "mongoose";
import { NextRequest } from "next/server";

// ─── User document shape (mirrors MongoDB) ────────────────────────────────────
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  emailVerifyToken: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

// ─── JWT payload shapes ───────────────────────────────────────────────────────
export interface AccessTokenPayload {
  userId: string;
  email: string;
  type: "access";
}

export interface RefreshTokenPayload {
  userId: string;
  type: "refresh";
}

export interface EmailTokenPayload {
  userId: string;
  email: string;
  type: "email_verify" | "password_reset";
}

// ─── Extends NextRequest to carry decoded user after auth middleware ───────────
export interface AuthRequest extends NextRequest {
  user: AccessTokenPayload;
}

// ─── API response shapes ──────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
  };
  tokens: AuthTokens;
}

// ─── Zod-inferred form types (schemas live in components) ─────────────────────
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  password: string;
  confirmPassword: string;
}