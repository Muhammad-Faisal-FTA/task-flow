"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

interface Props {
  busy: boolean;
  error: string;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export default function AdminLogin({ busy, error, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(email.trim(), password);
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-8 shadow-[0_24px_80px_rgba(33,52,87,0.14)] sm:p-10">
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
          <ShieldCheck size={28} aria-hidden="true" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">TaskFlow workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Use an administrator account to manage user access and platform services.</p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Email address
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3.5 font-semibold text-white transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-wait disabled:opacity-60">
            {busy ? "Signing in…" : "Continue to admin"}
            {!busy && <ArrowRight size={17} aria-hidden="true" />}
          </button>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-slate-500">Access is checked by the TaskFlow server on every admin request.</p>
      </section>
    </main>
  );
}
