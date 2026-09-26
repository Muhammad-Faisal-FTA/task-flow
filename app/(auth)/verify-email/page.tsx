"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";

function OtpForm() {
  const params = useSearchParams();
  const { verifyEmail } = useAuth();
  const [email, setEmail] = useState(params?.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit OTP.");
    setLoading(true);
    try { setSuccess((await verifyEmail(email, otp)).message); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Verification failed."); }
    finally { setLoading(false); }
  }

  if (success) return <div className="text-center space-y-5"><ShieldCheck className="w-14 h-14 mx-auto text-green-500"/><h1 className="text-[22px] font-bold text-white">Email verified</h1><AuthAlert variant="success" message={success}/><Link href="/login"><AuthButton type="button">Continue to Sign In</AuthButton></Link></div>;

  return <>
    <div className="text-center mb-6"><Mail className="w-12 h-12 mx-auto mb-3 text-blue-400"/><h1 className="text-[22px] font-bold text-white">Verify your email</h1><p className="text-[14px] text-slate-300">Enter the 6-digit code sent to your email. It expires in 10 minutes.</p></div>
    {error && <AuthAlert variant="error" message={error} className="mb-5"/>}
    <form onSubmit={submit} className="space-y-4">
      <AuthInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
      <AuthInput label="Verification OTP" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required/>
      <AuthButton type="submit" loading={loading}>Verify Email</AuthButton>
    </form>
  </>;
}

export default function VerifyEmailPage() { return <Suspense fallback={<p className="text-slate-300">Loading...</p>}><OtpForm/></Suspense>; }
