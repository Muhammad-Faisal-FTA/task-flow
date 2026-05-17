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
      className="flex flex-col"
      style={{
        minHeight:       "100dvh",
        backgroundColor: "var(--color-bg-app)",
        maxWidth:        "430px",
        margin:          "0 auto",
      }}
    >
      {/* Header with back button */}
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
                fontSize:      "var(--text-xs)",
                fontWeight:    700,
                color:         cdfEnabled
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

      {/* Dashboard content */}
      <div className="flex-1 overflow-hidden">
        <CdfDashboard />
      </div>

      {/* Bottom nav */}
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
  );
}