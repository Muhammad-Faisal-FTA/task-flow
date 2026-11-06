"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [emailLoaded, setEmailLoaded] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      setEmail(window.sessionStorage.getItem("taskflow:password-reset-email") ?? "");
    } catch {
      setEmail("");
    } finally {
      setEmailLoaded(true);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email) return setError("Request a reset code first.");
    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit code from your email.");
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return setError("Use at least 8 characters, including an uppercase letter and a number.");
    }
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await resetPassword(email, otp, password, confirmPassword);
      try {
        window.sessionStorage.removeItem("taskflow:password-reset-email");
      } catch {
        // Password reset still succeeds when browser storage is unavailable.
      }
      setSuccess(true);
    } catch (caught) {
      const failure = caught as Error;
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) return <div className="space-y-5 text-center">
    <ShieldCheck className="mx-auto h-14 w-14 text-green-500" />
    <h1 className="text-[22px] font-bold text-white">Password updated</h1>
    <AuthAlert variant="success" message="You can now sign in with your new password." />
    <Link href="/login"><AuthButton type="button">Continue to Sign In</AuthButton></Link>
  </div>;

  if (!emailLoaded) return <p className="text-center text-sm text-slate-300">Loading reset request…</p>;

  if (!email) return <div className="space-y-5 text-center">
    <h1 className="text-[22px] font-bold text-white">Reset password</h1>
    <AuthAlert variant="info" message="Start by requesting a reset code. Your email will be carried to this step automatically." />
    <Link href="/forgot-password"><AuthButton type="button">Request reset code</AuthButton></Link>
  </div>;

  return <>
    <div className="mb-6">
      <h1 className="mb-2 text-[22px] font-bold text-white">Reset password</h1>
      <p className="text-[14px]" style={{ color: "#B0C4DE" }}>Enter the 6-digit code sent to your email and choose a new password. The code expires in 10 minutes.</p>
    </div>
    {error && <AuthAlert variant="error" message={error} className="mb-5" />}
    <form onSubmit={submit} className="space-y-4">
      <AuthInput label="Reset code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
      <div>
        <AuthInput label="New password" type="password" icon={<Lock className="h-4 w-4" />} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <PasswordStrength password={password} />
      </div>
      <AuthInput label="Confirm new password" type="password" icon={<Lock className="h-4 w-4" />} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
      <AuthButton type="submit" loading={loading}>{loading ? "Updating password…" : "Reset Password"}</AuthButton>
    </form>
    <p className="mt-5 text-center text-[13px]" style={{ color: "#B0C4DE" }}>Need a code? <Link href="/forgot-password" className="font-semibold" style={{ color: "#29B6F6" }}>Request one</Link></p>
  </>;
}

export default ResetPasswordForm;
