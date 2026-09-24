import Link from "next/link";

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        backgroundColor: "#071A2E",
        color: "#F8FAFC",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          padding: "40px 28px",
        }}
      >
        <p style={{ margin: 0, fontSize: "clamp(4rem, 8vw, 6rem)", lineHeight: 1, fontWeight: 800 }}>
          🙈
        </p>
        <h1 style={{ margin: "24px 0 12px", fontSize: "2rem", lineHeight: 1.1 }}>
          Offline mode enabled
        </h1>
        <p style={{ margin: "0 0 24px", color: "#CBD5E1", fontSize: "1rem", lineHeight: 1.75 }}>
          You are currently offline, and this page was not cached yet. Navigate back to the app while online to cache it for later.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 18px",
              borderRadius: "999px",
              backgroundColor: "#0EA5E9",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Go to home
          </Link>
          <Link
            href="/settings"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              color: "#E2E8F0",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Retry settings after reconnect
          </Link>
        </div>
      </div>
    </main>
  );
}
