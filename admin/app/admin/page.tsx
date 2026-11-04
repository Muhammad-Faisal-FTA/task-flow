"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, LayoutDashboard, LogOut, RefreshCw, Server, Users } from "lucide-react";
import AdminLogin from "../../components/AdminLogin";
import AdminSummary from "../../components/AdminSummary";
import ServiceControls from "../../components/ServiceControls";
import UserAccessTable from "../../components/UserAccessTable";
import type { AdminRole, AdminSession, AdminSnapshot, FeatureKey, ServiceKey } from "../../lib/adminTypes";

type Section = "overview" | "users" | "services";

class RequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function readResponse(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new RequestError("The admin API returned a page instead of JSON. Check the backend URL and restart the admin app.", response.status);
  }
  return response.json();
}

export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [denied, setDenied] = useState(false);

  const signOut = useCallback(() => {
    if (session) {
      void (async () => {
        const logout = (token: string) => fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        try {
          const response = await logout(session.token);
          if (response.status !== 401) return;
          const refreshed = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
          const result = await readResponse(refreshed);
          if (refreshed.ok && typeof result.accessToken === "string") await logout(result.accessToken);
        } catch {
          // Local sign-out still completes when the backend is unavailable.
        }
      })();
    }
    setSession(null);
    setSnapshot(null);
    setDenied(false);
    setError("");
    setNotice("");
  }, [session]);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const refreshResponse = await fetch("/api/auth/refresh", { method: "POST", credentials: "include", cache: "no-store" });
        const refreshed = await readResponse(refreshResponse);
        if (!refreshResponse.ok || typeof refreshed.accessToken !== "string") return;
        const profileResponse = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${refreshed.accessToken}` },
          cache: "no-store",
        });
        const profile = await readResponse(profileResponse);
        const user = profile.user as { id?: unknown; email?: unknown } | undefined;
        if (profileResponse.ok && typeof user?.id === "string" && typeof user.email === "string" && active) {
          setSession({ token: refreshed.accessToken, userId: user.id, email: user.email });
        }
      } catch {
        // A missing or expired refresh cookie simply returns the user to sign in.
      } finally {
        if (active) setSessionReady(true);
      }
    }
    void restoreSession();
    return () => { active = false; };
  }, []);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!session) throw new RequestError("Sign in to continue.", 401);
    const send = (token: string) => {
      const headers = new Headers(init.headers);
      headers.set("Content-Type", "application/json");
      headers.set("Authorization", `Bearer ${token}`);
      return fetch(path, { ...init, cache: "no-store", credentials: "include", headers });
    };
    let response = await send(session.token);
    if (response.status === 401) {
      try {
        const refreshedResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        const refreshed = await readResponse(refreshedResponse);
        if (!refreshedResponse.ok || typeof refreshed.accessToken !== "string") throw new Error();
        const renewedSession = { ...session, token: refreshed.accessToken };
        setSession(renewedSession);
        response = await send(renewedSession.token);
      } catch {
        signOut();
        throw new RequestError("Your admin session expired. Sign in again.", 401);
      }
    }
    if (response.status === 401) {
      signOut();
      throw new RequestError("Your admin session expired. Sign in again.", 401);
    }
    const result = await readResponse(response);
    if (!response.ok) throw new RequestError(typeof result.error === "string" ? result.error : "The request failed.", response.status);
    return result;
  }, [session, signOut]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setDenied(false);
    try {
      setSnapshot(await request("/api/admin") as AdminSnapshot);
    } catch (cause) {
      if (cause instanceof RequestError && cause.status === 403) setDenied(true);
      setError(cause instanceof Error ? cause.message : "Unable to load admin controls.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (session) void load();
  }, [load, session]);

  async function signIn(email: string, password: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await readResponse(response);
      if (!response.ok) throw new RequestError(typeof result.error === "string" ? result.error : "Sign-in failed.", response.status);
      const user = result.user as { id?: unknown; email?: unknown } | undefined;
      if (typeof result.accessToken !== "string" || typeof user?.id !== "string" || typeof user.email !== "string") {
        throw new Error("The sign-in response is missing account details.");
      }
      const next: AdminSession = { token: result.accessToken, userId: user.id, email: user.email };
      setSession(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function change(changeData: Record<string, unknown>, successMessage: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setSnapshot(await request("/api/admin", {
        method: "PATCH",
        body: JSON.stringify(changeData),
      }) as AdminSnapshot);
      setNotice(successMessage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the change.");
    } finally {
      setBusy(false);
    }
  }

  if (!sessionReady) return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Restoring admin session…</main>;
  if (!session) return <AdminLogin busy={busy} error={error} onSubmit={signIn} />;

  if (denied) return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-700"><Users size={25} /></div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">Administrator access required</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{error || "This account does not have the administrator role."}</p>
        <button onClick={signOut} className="mt-6 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700">Sign out</button>
      </section>
    </main>
  );

  const nav: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "User access", icon: Users },
    { id: "services", label: "Services", icon: Server },
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fc] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
          <a href="/admin" className="flex items-center gap-3 rounded-xl px-2 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-700 text-sm font-black text-white">TF</span>
            <span><strong className="block text-sm">TaskFlow</strong><span className="text-xs text-slate-500">Administration</span></span>
          </a>
          <p className="mb-2 mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <nav className="space-y-1" aria-label="Admin sections">{nav.map(({ id, label, icon: Icon }) => <NavButton key={id} active={section === id} label={label} icon={Icon} onClick={() => setSection(id)} />)}</nav>
          <div className="mt-10 rounded-2xl bg-indigo-50 p-4"><div className="flex items-center gap-2 text-indigo-800"><Activity size={16} /><span className="text-xs font-bold">Protected console</span></div><p className="mt-2 text-xs leading-5 text-indigo-900/70">Every change is validated by the TaskFlow API.</p></div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">TaskFlow admin</p><p className="mt-1 truncate text-sm text-slate-500">Signed in as <span className="font-medium text-slate-800">{session.email}</span></p></div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => void load()} disabled={loading || busy} aria-label="Refresh dashboard" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
                <button onClick={signOut} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LogOut size={16} /><span className="hidden sm:inline">Sign out</span></button>
              </div>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden" aria-label="Admin sections">{nav.map(({ id, label, icon: Icon }) => <NavButton key={id} active={section === id} label={label} icon={Icon} onClick={() => setSection(id)} compact />)}</nav>
          </header>

          <div className="space-y-7 p-5 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{sectionTitle(section)}</h1><p className="mt-2 text-sm text-slate-500">Manage TaskFlow accounts and platform access.</p></div>{snapshot && <p className="text-xs text-slate-400">{snapshot.users.length} accounts · {snapshot.services.filter((item) => item.enabled).length} services active</p>}</div>

            {error && <div role="alert" className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error" className="font-bold">×</button></div>}
            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

            {loading && !snapshot ? <LoadingState /> : !snapshot ? <LoadError onRetry={() => void load()} /> : (
              <>
                {section === "overview" && <Overview snapshot={snapshot} onNavigate={setSection} />}
                {section === "users" && <UserAccessTable snapshot={snapshot} currentUserId={session.userId} busy={busy} onRoleChange={(userId: string, role: AdminRole) => void change({ action: "role", userId, role }, "Administrator role updated.")} onFeatureChange={(userId: string, feature: FeatureKey, enabled: boolean) => void change({ action: "feature", userId, feature, enabled }, "Feature access updated.")} />}
                {section === "services" && <ServiceControls services={snapshot.services} busy={busy} onChange={(service: ServiceKey, enabled: boolean) => void change({ action: "service", service, enabled }, `${service === "email" ? "Email" : "Web Push"} service ${enabled ? "enabled" : "disabled"}.`)} />}
              </>
            )}
            <footer className="pt-2 text-xs text-slate-400">TaskFlow Administration · Server-verified access controls</footer>
          </div>
        </div>
      </div>
    </main>
  );
}

function NavButton({ active, label, icon: Icon, onClick, compact = false }: { active: boolean; label: string; icon: typeof LayoutDashboard; onClick: () => void; compact?: boolean }) {
  return <button onClick={onClick} aria-current={active ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-indigo-50 text-indigo-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"} ${compact ? "border border-slate-200" : "w-full"}`}><Icon size={17} />{label}</button>;
}

function Overview({ snapshot, onNavigate }: { snapshot: AdminSnapshot; onNavigate: (section: Section) => void }) {
  const recentUsers = [...snapshot.users].slice(-5).reverse();
  return <div className="space-y-7"><AdminSummary snapshot={snapshot} /><section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-950">Recent accounts</h2><p className="mt-1 text-sm text-slate-500">Latest accounts created in TaskFlow.</p></div><button onClick={() => onNavigate("users")} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">Manage users</button></div><div className="mt-5 divide-y divide-slate-100">{recentUsers.map((user) => <div key={user.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-indigo-50 text-indigo-700" : user.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{user.role === "admin" ? "Admin" : user.isVerified ? "Verified" : "Unverified"}</span></div>)}{recentUsers.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No accounts yet.</p>}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-950">Quick actions</h2><p className="mt-1 text-sm text-slate-500">Go directly to a control area.</p><div className="mt-5 space-y-3"><button onClick={() => onNavigate("users")} className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50"><strong className="block text-sm">Review user access</strong><span className="mt-1 block text-xs text-slate-500">Roles and individual feature grants</span></button><button onClick={() => onNavigate("services")} className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50"><strong className="block text-sm">Configure services</strong><span className="mt-1 block text-xs text-slate-500">Global email and Web Push switches</span></button></div></div></section></div>;
}

function sectionTitle(section: Section) { return section === "overview" ? "Platform overview" : section === "users" ? "User access" : "Platform services"; }
function LoadingState() { return <div role="status" className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Loading admin controls…</div>; }
function LoadError({ onRetry }: { onRetry: () => void }) { return <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><p className="font-semibold text-slate-800">Admin controls could not be loaded.</p><p className="mt-1 text-sm text-slate-500">Check the connection and try again.</p><button onClick={onRetry} className="mt-4 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800">Try again</button></div></div>; }
