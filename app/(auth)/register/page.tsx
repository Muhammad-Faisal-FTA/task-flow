// app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

// ─── Schema ───────────────────────────────────────────────────────────────────
const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters")
      .trim(),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
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

type RegisterFormData = z.infer<typeof RegisterSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register: registerUser } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
  });

  // Watch password for live strength meter
  const passwordValue = watch("password", "");

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await registerUser(
        data.name,
        data.email,
        data.password,
        data.confirmPassword,
      );
      setSuccessMessage(
        "Account created! Please check your email to verify your account before signing in.",
      );
    } catch (err) {
      const error = err as Error & {
        status?: number;
        fields?: Record<string, string[]>;
      };

      // Handle field-level errors from server
      if (error.fields?.email) {
        setServerError(error.fields.email[0]);
      } else {
        setServerError(
          error.message ?? "Registration failed. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show success state after registration
  if (successMessage) {
    return (
      <>
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor: "rgba(67,160,71,0.15)" }}
          >
            ✉️
          </div>
          <h1 className="text-[22px] font-bold text-white mb-2">
            Check your email
          </h1>
          <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
            We sent a verification link to your email address.
          </p>
        </div>

        <AuthAlert
          variant="success"
          message={successMessage}
          className="mb-6"
        />

        <AuthButton variant="ghost" onClick={() => setSuccessMessage(null)}>
          Back to Register
        </AuthButton>

        <p
          className="text-center text-[13px] mt-4"
          style={{ color: "#B0C4DE" }}
        >
          Already verified?{" "}
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
          Create account
        </h1>
        <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
          Start managing your tasks with TaskFlow
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <AuthAlert variant="error" message={serverError} className="mb-5" />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <AuthInput
          label="Full Name"
          type="text"
          placeholder="John Doe"
          icon={<User className="w-4 h-4" />}
          error={errors.name?.message}
          autoComplete="name"
          autoFocus
          {...register("name")}
        />

        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          autoComplete="email"
          {...register("email")}
        />

        <div>
          <AuthInput
            label="Password"
            type="password"
            placeholder="Create a strong password"
            icon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            autoComplete="new-password"
            {...register("password")}
          />
          {/* Live strength meter */}
          <PasswordStrength password={passwordValue} />
        </div>

        <AuthInput
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          icon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register("confirmPassword")}
        />

        <AuthButton type="submit" loading={isLoading} className="mt-2">
          {isLoading ? "Creating account…" : "Create Account"}
        </AuthButton>
      </form>

      {/* Terms */}
      <p
        className="text-center text-[12px] mt-4 leading-relaxed"
        style={{ color: "#546E7A" }}
      >
        By creating an account, you agree to our{" "}
        <span className="cursor-pointer underline" style={{ color: "#29B6F6" }}>
          Terms of Service
        </span>{" "}
        and{" "}
        <span className="cursor-pointer underline" style={{ color: "#29B6F6" }}>
          Privacy Policy
        </span>
      </p>

      {/* Login link */}
      <p className="text-center text-[13px] mt-5" style={{ color: "#B0C4DE" }}>
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold transition-opacity hover:opacity-80"
          style={{ color: "#29B6F6" }}
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
