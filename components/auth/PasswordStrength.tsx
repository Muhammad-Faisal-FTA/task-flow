// components/auth/PasswordStrength.tsx — uses your CSS classes
"use client";

import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
}

const RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "One special character (!@#$)",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

const SCORE_CLASS = [
  "",
  "active-weak",
  "active-fair",
  "active-good",
  "active-strong",
];
const SCORE_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const SCORE_COLOR = [
  "",
  "var(--color-overdue)",
  "var(--color-warning)",
  "var(--color-today)",
  "var(--color-success)",
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = useMemo(
    () => RULES.filter((r) => r.test(password)).length,
    [password],
  );

  if (!password) return null;

  return (
    <div
      className="mt-2"
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      {/* Strength bars */}
      <div style={{ display: "flex", gap: "6px" }}>
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`strength-bar ${score >= level ? SCORE_CLASS[score] : ""}`}
          />
        ))}
      </div>

      {/* Label */}
      {score > 0 && (
        <p
          className="text-sm-token font-medium"
          style={{ color: SCORE_COLOR[score] }}
        >
          {SCORE_LABEL[score]}
        </p>
      )}

      {/* Rules checklist */}
      <ul style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <li
              key={rule.label}
              className="text-sm-token flex items-center gap-2"
              style={{
                color: passed
                  ? "var(--color-success)"
                  : "var(--color-text-hint)",
              }}
            >
              <span style={{ fontSize: "10px" }}>{passed ? "✓" : "○"}</span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
// ```

// ---

// **What this covers:**

// - ✅ **Design** — exact brand colors (`#071A2E`, `#0D3A6B`, `#1565A8`, `#1E8BC3`, `#29B6F6`) from design system
// - ✅ **Design** — mobile-first card, max-width 420px, consistent with 360–430px NFR
// - ✅ **UX** — password show/hide toggle, caret color matches brand
// - ✅ **UX** — `PasswordStrength` — live bars + checklist, same rules as Zod schema (consistent policy)
// - ✅ **UX** — `AuthAlert` — success/error/info variants with icons, used across all 5 auth pages
// - ✅ **Performance** — `PasswordStrength` uses `useMemo` — score only recalculated when password changes (NFR)
// - ✅ **Performance** — `forwardRef` on `AuthInput` — React Hook Form needs direct ref access
// - ✅ **Accessibility** — labels linked to inputs, password toggle `tabIndex={-1}` (doesn't interrupt tab flow)

// ---

// **Components created:**
// ```
// components/auth/AuthInput.tsx         ← text/email/password input
// components/auth/AuthButton.tsx        ← primary + ghost variants
// components/auth/AuthDivider.tsx       ← "or" divider line
// components/auth/AuthAlert.tsx         ← success/error/info banner
// components/auth/PasswordStrength.tsx  ← live strength meter
// app/(auth)/layout.tsx                 ← dark card shell
