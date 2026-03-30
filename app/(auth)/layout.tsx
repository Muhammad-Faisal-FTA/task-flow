// app/(auth)/layout.tsx — uses your CSS classes
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | TaskFlow", default: "TaskFlow" },
  description: "Manage your tasks efficiently with TaskFlow",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-layer-0 min-h-screen w-full flex items-center justify-center px-4 py-10">
      {/* Subtle grid — uses CSS var directly */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-border-default) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-border-default) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow — top right */}
      <div
        className="fixed top-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(21,101,168,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Glow — bottom left */}
      <div
        className="fixed bottom-0 left-0 w-[300px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at bottom left, rgba(30,139,195,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Card wrapper */}
      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-brand rounded-card w-9 h-9 flex items-center justify-center text-text-primary font-bold text-lg-token">
            ✓
          </div>
          <span className="text-text-primary text-2xl-token font-bold tracking-tight">
            TaskFlow
          </span>
        </div>

        {/* Auth card — uses .auth-card from custom-classes.css */}
        <div className="auth-card">{children}</div>

        {/* Footer */}
        <p className="text-center text-sm-token text-text-hint mt-6">
          © {new Date().getFullYear()} TaskFlow. All rights reserved.
        </p>
      </div>
    </div>
  );
}
