// app/(auth)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";

// ─── Schema ───────────────────────────────────────────────────────────────────
const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await forgotPassword(data.email);
      setSuccessMessage(result.message);
    } catch (err) {
      const error = err as Error & { status?: number };

      // 429 — rate limited
      if (error.status === 429) {
        setServerError(
          "Too many reset attempts. Please wait an hour before trying again.",
        );
      } else {
        setServerError(
          error.message ?? "Something went wrong. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (successMessage) {
    return (
      <>
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
            style={{ backgroundColor: "rgba(41,182,246,0.12)" }}
          >
            📬
          </div>
          <h1 className="text-[22px] font-bold text-white mb-2">
            Check your inbox
          </h1>
          <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
            We sent a reset link to{" "}
            <span className="font-semibold text-white">
              {getValues("email")}
            </span>
          </p>
        </div>

        <AuthAlert variant="info" message={successMessage} className="mb-6" />

        <div
          className="rounded-[10px] p-4 text-[13px] mb-6 space-y-1"
          style={{
            backgroundColor: "rgba(21,101,168,0.1)",
            color: "#B0C4DE",
            border: "1px solid rgba(21,101,168,0.2)",
          }}
        >
          <p>
            • The link expires in <strong className="text-white">1 hour</strong>
          </p>
          <p>• Check your spam folder if you don&apos;t see it</p>
          <p>
            • You can only request{" "}
            <strong className="text-white">3 resets per hour</strong>
          </p>
        </div>

        <AuthButton variant="ghost" onClick={() => setSuccessMessage(null)}>
          Send another link
        </AuthButton>

        <p
          className="text-center text-[13px] mt-4"
          style={{ color: "#B0C4DE" }}
        >
          Remembered your password?{" "}
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

  return (
    <>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-white mb-1.5">
          Forgot password?
        </h1>
        <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <AuthAlert variant="error" message={serverError} className="mb-5" />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <AuthInput
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          autoComplete="email"
          autoFocus
          {...register("email")}
        />

        <AuthButton type="submit" loading={isLoading} className="mt-2">
          {isLoading ? "Sending reset link…" : "Send Reset Link"}
        </AuthButton>
      </form>

      {/* Back to login */}
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 mt-5 text-[13px] font-medium transition-opacity hover:opacity-80"
        style={{ color: "#B0C4DE" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </Link>
    </>
  );
}
