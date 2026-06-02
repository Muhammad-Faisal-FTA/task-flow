// components/PushSWRegistrar.tsx
"use client";

import { useEffect } from "react";

export function PushSWRegistrar() {
  useEffect(() => {
    if (
      typeof window    === "undefined" ||
      !("serviceWorker" in navigator)
    ) return;

    navigator.serviceWorker
      .register("/sw-push.js", { scope: "/" })
      .then(reg  => console.log("[SW] Push SW registered:", reg.scope))
      .catch(err => console.error("[SW] Push SW failed:", err));
  }, []);

  // Renders nothing — side effect only
  return null;
}