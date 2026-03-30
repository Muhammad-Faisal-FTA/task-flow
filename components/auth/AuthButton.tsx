// components/auth/AuthButton.tsx — uses your CSS classes
"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "ghost";
}

export function AuthButton({
  loading,
  variant = "primary",
  children,
  className,
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        variant === "primary" ? "btn-primary" : "btn-ghost",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
