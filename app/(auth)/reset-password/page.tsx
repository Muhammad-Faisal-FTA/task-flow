// app/(auth)/reset-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

// ─── Schema ───────────────────────────────────────────────────────────────────
const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const token = searchParams.get("token");

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const passwordValue = watch("password", "");

  // ── No token guard ─────────────────────────────────────────────────────────
  if (!token) {
    return (
      <>
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(229,57,53,0.15)" }}
          >
            <Lock className="w-8 h-8" style={{ color: "#E53935" }} />
          </div>
          <h1 className="text-[22px] font-bold text-white mb-2">
            Invalid Link
          </h1>
          <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
            This reset link is missing or invalid.
          </p>
        </div>

        <AuthAlert
          variant="error"
          message="Please request a new password reset link."
          className="mb-6"
        />

        <Link href="/forgot-password">
          <AuthButton type="button">Request New Link</AuthButton>
        </Link>
      </>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <>
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(67,160,71,0.15)" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: "#43A047" }} />
          </div>
          <h1 className="text-[22px] font-bold text-white mb-2">
            Password Reset!
          </h1>
          <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
            Your password has been updated successfully.
          </p>
        </div>

        <AuthAlert
          variant="success"
          message="You can now sign in with your new password."
          className="mb-6"
        />

        <Link href="/login">
          <AuthButton type="button">Continue to Sign In</AuthButton>
        </Link>
      </>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    setIsLoading(true);

    try {
      await resetPassword(token, data.password, data.confirmPassword);
      setIsSuccess(true);
    } catch (err) {
      const error = err as Error & { status?: number };

      if (error.status === 410) {
        setServerError(
          "This reset link has expired. Please request a new one.",
        );
      } else if (error.status === 400) {
        setServerError("This reset link is invalid or has already been used.");
      } else {
        setServerError(error.message ?? "Reset failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-white mb-1.5">
          Reset password
        </h1>
        <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
          Choose a strong new password for your account.
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <>
          <AuthAlert variant="error" message={serverError} className="mb-5" />
          {/* If expired/invalid — offer to get new link */}
          <Link href="/forgot-password">
            <AuthButton variant="ghost" className="mb-5" type="button">
              Request New Reset Link
            </AuthButton>
          </Link>
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <AuthInput
            label="New Password"
            type="password"
            placeholder="Create a strong password"
            icon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            autoComplete="new-password"
            autoFocus
            {...register("password")}
          />
          <PasswordStrength password={passwordValue} />
        </div>

        <AuthInput
          label="Confirm New Password"
          type="password"
          placeholder="Repeat your new password"
          icon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register("confirmPassword")}
        />

        <AuthButton type="submit" loading={isLoading} className="mt-2">
          {isLoading ? "Resetting password…" : "Reset Password"}
        </AuthButton>
      </form>

      {/* Back to login */}
      <p className="text-center text-[13px] mt-5" style={{ color: "#B0C4DE" }}>
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold"
          style={{ color: "#29B6F6" }}
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
