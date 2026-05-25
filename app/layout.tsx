// // app/layout.tsx
// // "use client";
// // import { useEffect } from "react";
// import type { Metadata, Viewport } from "next";
// import "./globals.css";
// import { AuthProvider } from "@/hooks/useAuth";

// export const metadata: Metadata = {
//   title: {
//     template: "%s | TaskFlow",
//     default: "TaskFlow — Task Manager",
//   },
//   description: "Manage your tasks efficiently with TaskFlow",
//   manifest: "/manifest.json",
//   appleWebApp: {
//     capable: true,
//     statusBarStyle: "black-translucent",
//     title: "TaskFlow",
//   },
//   icons: {
//     icon: [
//       { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
//       { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
//     ],
//     apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
//   },
// };

// export const viewport: Viewport = {
//   width: "device-width",
//   initialScale: 1,
//   maximumScale: 1,
//   userScalable: false,
//   themeColor: "#071A2E",
//   viewportFit: "cover", // ← handles iPhone notch
// };

// // export function ServiceWorkerRegistrar() {
// //   useEffect(() => {
// //     if (
// //       typeof window !== "undefined" &&
// //       "serviceWorker" in navigator &&
// //       process.env.NODE_ENV === "production"
// //     ) {
// //       // next-pwa registers its own SW — our custom SW runs alongside
// //       navigator.serviceWorker
// //         .register("/sw-custom.js")
// //         .then((reg) => console.log("[SW] Custom SW registered", reg.scope))
// //         .catch((err) => console.error("[SW] Custom SW failed", err));
// //     }
// //   }, []);
// // }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <head>
//         {/* iOS PWA meta tags */}
//         <meta name="apple-mobile-web-app-capable" content="yes" />
//         <meta
//           name="apple-mobile-web-app-status-bar-style"
//           content="black-translucent"
//         />
//         <meta name="apple-mobile-web-app-title" content="TaskFlow" />
//         <meta name="mobile-web-app-capable" content="yes" />
//         <meta name="msapplication-TileColor" content="#071A2E" />
//         <meta name="msapplication-tap-highlight" content="no" />

//         {/* Splash screen colors */}
//         <meta name="theme-color" content="#071A2E" />

//         {/* Preconnect for performance */}
//         <link rel="preconnect" href="https://fonts.googleapis.com" />
//         <link
//           rel="preconnect"
//           href="https://fonts.gstatic.com"
//           crossOrigin="anonymous"
//         />
//       </head>
//       <body suppressHydrationWarning>
//         <AuthProvider>{children}</AuthProvider>
//       </body>
//     </html>
//   );
// }


// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider }    from "@/hooks/useAuth";

export const metadata: Metadata = {
  title: {
    template: "%s | TaskFlow",
    default:  "TaskFlow — Task Manager",
  },
  description: "Manage your tasks efficiently with TaskFlow",
  manifest:    "/manifest.json",
  appleWebApp: {
    capable:         true,
    statusBarStyle:  "black-translucent",
    title:           "TaskFlow",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png",       sizes: "32x32",  type: "image/png" },
      { url: "/icons/icon-192x192.png",  sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width:         "device-width",
  initialScale:  1,
  maximumScale:  1,
  userScalable:  false,
  themeColor:    "#071A2E",
  viewportFit:   "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* iOS PWA meta tags */}
        <meta name="apple-mobile-web-app-capable"          content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title"            content="TaskFlow" />
        <meta name="mobile-web-app-capable"                content="yes" />
        <meta name="msapplication-TileColor"               content="#071A2E" />
        <meta name="msapplication-tap-highlight"           content="no" />
        <meta name="theme-color"                           content="#071A2E" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          {/* Registers sw-push.js for push notification handling */}
          <PushSWRegistrar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

// Fallback stub to avoid "Cannot find name 'PushSWRegistrar'".
// Intentionally a server-side no-op; implement a client-side registrar
// in a separate file if service worker registration is required.
const PushSWRegistrar = () => null;
