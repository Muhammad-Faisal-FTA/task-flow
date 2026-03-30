// components/auth/AuthAlert.tsx — uses your CSS classes
import { cn } from "@/lib/cn";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type AlertVariant = "success" | "error" | "info";

interface AuthAlertProps {
  variant: AlertVariant;
  message: string;
  className?: string;
}

const ICON: Record<AlertVariant, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />,
  error: <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />,
  info: <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />,
};

export function AuthAlert({ variant, message, className }: AuthAlertProps) {
  return (
    <div className={cn(`alert-${variant}`, className)}>
      {ICON[variant]}
      <span className="leading-snug">{message}</span>
    </div>
  );
}
