// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";
import type { Metadata } from "next";

// ─── Schema ───────────────────────────────────────────────────────────────────
const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      router.push("/");
    } catch (err) {
      const error = err as Error & { status?: number };

      // Special case: unverified email — give actionable message
      if (error.status === 403) {
        setServerError(
          "Your email is not verified. Please check your inbox for the verification link.",
        );
      } else {
        setServerError(error.message ?? "Login failed. Please try again.");
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
          Welcome back
        </h1>
        <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
          Sign in to your TaskFlow account
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <AuthAlert variant="error" message={serverError} className="mb-5" />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          autoComplete="email"
          autoFocus
          {...register("email")}
        />

        <div className="space-y-1">
          <AuthInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            icon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            autoComplete="current-password"
            {...register("password")}
          />

          {/* Forgot password link */}
          <div className="flex justify-end pt-1">
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium transition-opacity hover:opacity-80"
              style={{ color: "#29B6F6" }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <AuthButton type="submit" loading={isLoading} className="mt-2">
          {isLoading ? "Signing in…" : "Sign In"}
        </AuthButton>
      </form>

      {/* Register link */}
      <p className="text-center text-[13px] mt-6" style={{ color: "#B0C4DE" }}>
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold transition-opacity hover:opacity-80"
          style={{ color: "#29B6F6" }}
        >
          Create one
        </Link>
      </p>
    </>
  );
}
