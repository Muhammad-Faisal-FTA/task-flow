"use client";

import { Search, ShieldCheck, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminRole, AdminSnapshot, FeatureKey } from "../lib/adminTypes";
import { FEATURES } from "../lib/adminTypes";

type Filter = "all" | "admins" | "unverified";
interface Props {
  snapshot: AdminSnapshot;
  currentUserId: string;
  busy: boolean;
  onRoleChange: (userId: string, role: AdminRole) => void;
  onFeatureChange: (userId: string, feature: FeatureKey, enabled: boolean) => void;
}

export default function UserAccessTable({ snapshot, currentUserId, busy, onRoleChange, onFeatureChange }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const visibleUsers = useMemo(() => snapshot.users.filter((user) => {
    const matchesText = `${user.name} ${user.email}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "all" || (filter === "admins" ? user.role === "admin" : !user.isVerified);
    return matchesText && matchesFilter;
  }), [filter, query, snapshot.users]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-lg font-semibold text-slate-950">User access</h2><p className="mt-1 text-sm text-slate-500">Manage administrator roles and individual feature access.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" aria-label="Search users" className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-64" />
          </label>
          <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} aria-label="Filter users" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">
            <option value="all">All accounts</option><option value="admins">Administrators</option><option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {visibleUsers.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <article key={user.id} className="grid gap-5 p-5 xl:grid-cols-[minmax(220px,1fr)_180px_minmax(330px,1.5fr)] xl:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"><UserRound size={19} aria-hidden="true" /></span>
                <div className="min-w-0"><p className="truncate font-semibold text-slate-950">{user.name}</p><p className="truncate text-sm text-slate-500">{user.email}</p></div>
              </div>

              <div className="flex items-center gap-2">
                {user.isVerified ? <ShieldCheck size={16} className="text-emerald-600" /> : <span className="h-2 w-2 rounded-full bg-amber-500" />}
                <span className={`text-sm ${user.isVerified ? "text-emerald-700" : "text-amber-700"}`}>{user.isVerified ? "Verified" : "Needs verification"}</span>
                <label className="sr-only" htmlFor={`role-${user.id}`}>Role for {user.email}</label>
                <select id={`role-${user.id}`} value={user.role} disabled={busy || isSelf} onChange={(event) => onRoleChange(user.id, event.target.value as AdminRole)} className="ml-auto rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500">
                  <option value="user">User</option><option value="admin">Admin</option>
                </select>
              </div>

              {user.role === "admin" ? (
                <p className="flex items-center gap-2 text-sm text-indigo-700"><ShieldCheck size={17} />Administrators have access to all features.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {FEATURES.map(({ key, label }) => {
                    const grant = snapshot.permissions.find((item) => item.userId === user.id && item.feature === key);
                    const enabled = grant?.enabled ?? true;
                    return (
                      <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                        <input type="checkbox" checked={enabled} disabled={busy} onChange={(event) => onFeatureChange(user.id, key, event.target.checked)} className="h-4 w-4 accent-indigo-700" />
                        <span>{label}</span><span className="ml-auto text-xs text-slate-400">{enabled ? "On" : "Off"}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {isSelf && <p className="xl:col-start-2 xl:-mt-3 xl:text-right text-xs text-slate-400">Your admin role is protected here.</p>}
            </article>
          );
        })}
        {visibleUsers.length === 0 && <div className="p-12 text-center"><p className="font-medium text-slate-800">No accounts match this view.</p><p className="mt-1 text-sm text-slate-500">Try another search or filter.</p></div>}
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">Showing {visibleUsers.length} of {snapshot.users.length} accounts</div>
    </section>
  );
}
