"use client";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SelectFieldProps {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
  dotColor?: string;
}

export function SelectField({ label, value, options, onChange, className, dotColor }: SelectFieldProps) {
  const selected = options.find(o => o.value === value);

  return (
    <div className={cn("relative", className)}>
      {label && (
        <p className="text-[11px] font-semibold tracking-widest uppercase text-brand-accent mb-2">
          {label}
        </p>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-layer-2 border border-layer-3/40 rounded-input px-4 py-3 text-[14px] text-text-primary pr-10 outline-none focus:border-brand-accent transition-colors cursor-pointer"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-layer-1">
              {opt.label}
            </option>
          ))}
        </select>
        {dotColor && (
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
        )}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tag pointer-events-none" />
      </div>
    </div>
  );
}
