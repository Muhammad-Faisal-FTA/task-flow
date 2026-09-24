// // app/cdf/page.tsx
// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/hooks/useAuth";
// import { HeaderBar } from "@/components/layout/HeaderBar";
// import { CdfDashboard } from "@/components/cdf/CdfDashboard";

// export default function CdfPage() {
//   const { isAuthenticated, isLoading } = useAuth();
//   const router = useRouter();

//   // Auth guard
//   useEffect(() => {
//     if (!isLoading && !isAuthenticated) {
//       router.push("/login");
//     }
//   }, [isAuthenticated, isLoading, router]);

//   if (isLoading || !isAuthenticated) {
//     return (
//       <div
//         className="flex items-center justify-center min-h-screen"
//         style={{ backgroundColor: "var(--color-bg-app)" }}
//       >
//         <div
//           className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
//           style={{ borderColor: "var(--color-primary)" }}
//         />
//       </div>
//     );
//   }

//   return (
//     <div
//       className="flex flex-col"
//       style={{
//         minHeight: "100dvh",
//         backgroundColor: "var(--color-bg-app)",
//         maxWidth: "430px",
//         margin: "0 auto",
//       }}
//     >
//       <HeaderBar
//         title="CDF Tracker"
//         rightAction={
//           <div
//             className="flex items-center gap-1 px-2.5 py-1 rounded-pill"
//             style={{
//               backgroundColor: "rgba(41,182,246,0.1)",
//               border: "1px solid rgba(41,182,246,0.3)",
//             }}
//           >
//             <span style={{ fontSize: "10px" }}>⚡</span>
//             <span
//               style={{
//                 fontSize: "var(--text-xs)",
//                 fontWeight: 700,
//                 color: "var(--color-today)",
//                 letterSpacing: "0.5px",
//               }}
//             >
//               CDF
//             </span>
//           </div>
//         }
//       />

//       <CdfDashboard />
//     </div>
//   );
// }


// app/cdf/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter }      from "next/navigation";
import { useAuth }        from "@/hooks/useAuth";
import { useCdfSettings } from "@/hooks/useCdfSettings";
import { HeaderBar }      from "@/components/layout/HeaderBar";
import { CdfDashboard }   from "@/components/cdf/CdfDashboard";
import { BottomNav }      from "@/components/layout/BottomNav";
import { SidebarNav }      from "@/components/layout/SidebarNav";

export default function CdfPage() {
  const router  = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { enabled: cdfEnabled } = useCdfSettings();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--color-bg-app)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-primary)" }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen w-full"
      style={{
        backgroundColor: "var(--color-bg-app)",
      }}
    >
      <div className="hidden md:block flex-shrink-0">
        <SidebarNav
          screen="cdf"
          hasOverdue={false}
          quickAddOpen={false}
          onHome={() => router.push("/")}
          onAdd={() => router.push("/")}
          onLists={() => router.push("/")}
          onSettings={() => router.push("/settings")}
        />
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <HeaderBar
          title="CDF Tracker"
          showBack
          onBack={() => router.push("/")}
          rightAction={
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-pill"
              style={{
                backgroundColor: cdfEnabled
                  ? "rgba(41,182,246,0.15)"
                  : "rgba(84,110,122,0.15)",
                border: `1px solid ${cdfEnabled
                  ? "rgba(41,182,246,0.3)"
                  : "rgba(84,110,122,0.3)"}`,
              }}
            >
              <span style={{ fontSize: "10px" }}>⚡</span>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  color: cdfEnabled
                    ? "var(--color-today)"
                    : "var(--color-text-hint)",
                  letterSpacing: "0.5px",
                }}
              >
                {cdfEnabled ? "ON" : "OFF"}
              </span>
            </div>
          }
        />

        <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 overflow-hidden">
          <CdfDashboard />
        </div>

        <div className="md:hidden">
          <BottomNav
            screen="cdf"
            hasOverdue={false}
            quickAddOpen={false}
            onHome={() => router.push("/")}
            onAdd={() => router.push("/")}
            onLists={() => router.push("/")}
            onSettings={() => router.push("/settings")}
          />
        </div>
      </main>
    </div>
  );
}