// components/auth/AuthInput.tsx — uses your CSS classes
"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full" style={{ marginBottom: "0" }}>
        {/* Label — uses .section-label from custom-classes.css */}
        <label className="section-label block mb-1.5">{label}</label>

        {/* Input wrapper */}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              "auth-input",
              icon ? "pl-10" : "pl-4",
              isPassword ? "pr-11" : "pr-4",
              error ? "error" : "",
              className,
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-hint hover:opacity-80 transition-opacity"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-text-error text-xs-token flex items-center gap-1 mt-1.5">
            <span>⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  },
);

AuthInput.displayName = "AuthInput";
