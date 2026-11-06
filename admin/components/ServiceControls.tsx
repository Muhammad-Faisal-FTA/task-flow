"use client";

import { Mail, Radio, ShieldCheck, ShieldOff } from "lucide-react";
import type { AdminService, ServiceKey } from "../lib/adminTypes";
import { SERVICE_INFO } from "../lib/adminTypes";

interface Props {
  services: AdminService[];
  busy: boolean;
  onChange: (service: ServiceKey, enabled: boolean) => void;
}

const ICONS = { email: Mail, push: Radio };

export default function ServiceControls({ services, busy, onChange }: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {services.map(({ service, enabled }) => {
        const Icon = ICONS[service];
        return (
          <article key={service} className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Icon size={22} aria-hidden="true" /></span>
              <div>
                <h3 className="font-semibold text-slate-950">{SERVICE_INFO[service].label}</h3>
                <p className="mt-1 max-w-md text-sm leading-5 text-slate-600">{SERVICE_INFO[service].description}</p>
                <p className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${enabled ? "text-emerald-700" : "text-slate-500"}`}>
                  {enabled ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                  {enabled ? "Enabled platform-wide" : "Disabled platform-wide"}
                </p>
              </div>
            </div>
            <label className="flex shrink-0 items-center gap-3 text-sm font-medium text-slate-700">
              <span>{enabled ? "On" : "Off"}</span>
              <input
                type="checkbox"
                role="switch"
                aria-label={`Enable ${SERVICE_INFO[service].label}`}
                checked={enabled}
                disabled={busy}
                onChange={(event) => onChange(service, event.target.checked)}
                className="h-5 w-5 accent-indigo-700 disabled:opacity-50"
              />
            </label>
          </article>
        );
      })}
    </section>
  );
}
