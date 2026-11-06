"use client";

import { CheckCircle2, Shield, Users, XCircle } from "lucide-react";
import type { AdminSnapshot } from "../lib/adminTypes";

export default function AdminSummary({ snapshot }: { snapshot: AdminSnapshot }) {
  const verified = snapshot.users.filter((user) => user.isVerified).length;
  const admins = snapshot.users.filter((user) => user.role === "admin").length;
  const servicesOn = snapshot.services.filter((service) => service.enabled).length;
  const cards = [
    { label: "Total accounts", value: snapshot.users.length, icon: Users, iconClass: "bg-indigo-50 text-indigo-700" },
    { label: "Verified accounts", value: verified, icon: CheckCircle2, iconClass: "bg-emerald-50 text-emerald-700" },
    { label: "Administrators", value: admins, icon: Shield, iconClass: "bg-violet-50 text-violet-700" },
    { label: "Services enabled", value: `${servicesOn}/${snapshot.services.length}`, icon: servicesOn ? CheckCircle2 : XCircle, iconClass: "bg-amber-50 text-amber-700" },
  ];

  return (
    <section aria-label="Platform overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, iconClass }) => (
        <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <span className={`rounded-xl p-2 ${iconClass}`}><Icon size={18} aria-hidden="true" /></span>
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </article>
      ))}
    </section>
  );
}
