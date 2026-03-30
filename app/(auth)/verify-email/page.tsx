// app/(auth)/verify-email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, MailOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthButton } from "@/components/auth/AuthButton";

// ─── States ───────────────────────────────────────────────────────────────────
type VerifyState = "loading" | "success" | "expired" | "invalid" | "missing";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuth();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");

    // No token in URL
    if (!token) {
      setState("missing");
      return;
    }

    // Verify on mount — runs once
    async function verify() {
      try {
        const result = await verifyEmail(token!);
        setMessage(result.message);
        setState("success");
      } catch (err) {
        const error = err as Error & { status?: number };

        if (error.status === 410) {
          setState("expired");
        } else {
          setState("invalid");
        }

        setMessage(error.message ?? "Verification failed.");
      }
    }

    verify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <Loader2
          className="w-10 h-10 animate-spin"
          style={{ color: "#1E8BC3" }}
        />
        <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
          Verifying your email…
        </p>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (state === "success") {
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
            Email Verified!
          </h1>
          <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
            Your account is now active.
          </p>
        </div>

        <AuthAlert
          variant="success"
          message={
            message || "Email verified successfully. You can now log in."
          }
          className="mb-6"
        />

        <Link href="/login">
          <AuthButton type="button">Continue to Sign In</AuthButton>
        </Link>
      </>
    );
  }

  // ── Expired ────────────────────────────────────────────────────────────────
  if (state === "expired") {
    return (
      <>
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(245,124,0,0.15)" }}
          >
            <MailOpen className="w-8 h-8" style={{ color: "#F57C00" }} />
          </div>
          <h1 className="text-[22px] font-bold text-white mb-2">
            Link Expired
          </h1>
          <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
            Your verification link has expired.
          </p>
        </div>

        <AuthAlert
          variant="error"
          message="Verification links expire after 24 hours. Please register again to get a new link."
          className="mb-6"
        />

        <Link href="/register">
          <AuthButton type="button">Register Again</AuthButton>
        </Link>

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

  // ── Invalid / Missing ──────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col items-center text-center mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "rgba(229,57,53,0.15)" }}
        >
          <XCircle className="w-8 h-8" style={{ color: "#E53935" }} />
        </div>
        <h1 className="text-[22px] font-bold text-white mb-2">
          {state === "missing" ? "No Token Found" : "Invalid Link"}
        </h1>
        <p className="text-[14px]" style={{ color: "#B0C4DE" }}>
          {state === "missing"
            ? "This page requires a verification token from your email."
            : "This verification link is invalid or has already been used."}
        </p>
      </div>

      <AuthAlert
        variant="error"
        message={
          state === "missing"
            ? "Please click the verification link sent to your email."
            : message || "Invalid verification link."
        }
        className="mb-6"
      />

      <Link href="/register">
        <AuthButton type="button">Back to Register</AuthButton>
      </Link>
    </>
  );
}
