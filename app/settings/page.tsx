
// // app/settings/page.tsx
// "use client";

// import { useEffect, useState }      from "react";
// import { useRouter }                from "next/navigation";
// import { useAuth }                  from "@/hooks/useAuth";
// import { useCdfSettings }           from "@/hooks/useCdfSettings";
// import { usePushNotifications }     from "../../hooks/usePushNotifications";
// import { HeaderBar }                from "@/components/layout/HeaderBar";
// import { BottomNav }                from "@/components/layout/BottomNav";
// import {
//   Bell, Shield, ChevronRight,
//   LogOut, Trash2, BarChart2,
//   Moon, Info, Mail,
// } from "lucide-react";
// import { permission } from "process";

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface SettingsRowProps {
//   icon:       React.ReactNode;
//   label:      string;
//   value?:     string;
//   onClick?:   () => void;
//   danger?:    boolean;
//   rightNode?: React.ReactNode;
// }

// interface SettingsSectionProps {
//   title:    string;
//   children: React.ReactNode;
// }

// // ─── Settings row ─────────────────────────────────────────────────────────────
// function SettingsRow({
//   icon, label, value, onClick, danger, rightNode,
// }: SettingsRowProps) {
//   return (
//     <button
//       onClick={onClick}
//       disabled={!onClick && !rightNode}
//       className="w-full flex items-center gap-3 active:scale-[0.99] transition-transform"
//       style={{
//         padding:         "13px 16px",
//         backgroundColor: "transparent",
//         border:          "none",
//         cursor:          onClick ? "pointer" : "default",
//         textAlign:       "left",
//       }}
//     >
//       <div
//         className="flex items-center justify-center rounded-[8px] flex-shrink-0"
//         style={{
//           width:           "34px",
//           height:          "34px",
//           backgroundColor: danger
//             ? "rgba(229,57,53,0.12)"
//             : "rgba(21,101,168,0.15)",
//           color: danger ? "var(--color-overdue)" : "var(--color-accent)",
//         }}
//       >
//         {icon}
//       </div>

//       <div className="flex-1 min-w-0">
//         <p style={{
//           fontSize:   "var(--text-base)",
//           fontWeight: 500,
//           color:      danger
//             ? "var(--color-overdue)"
//             : "var(--color-text-primary)",
//         }}>
//           {label}
//         </p>
//         {value && (
//           <p style={{
//             fontSize:  "var(--text-xs)",
//             color:     "var(--color-text-hint)",
//             marginTop: "1px",
//           }}>
//             {value}
//           </p>
//         )}
//       </div>

//       {rightNode ?? (onClick && (
//         <ChevronRight style={{
//           width:      "16px",
//           height:     "16px",
//           color:      "var(--color-text-hint)",
//           flexShrink: 0,
//         }} />
//       ))}
//     </button>
//   );
// }

// // ─── Settings section ─────────────────────────────────────────────────────────
// function SettingsSection({ title, children }: SettingsSectionProps) {
//   return (
//     <div style={{ marginBottom: "20px" }}>
//       <p style={{
//         fontSize:      "var(--text-xs)",
//         fontWeight:    700,
//         letterSpacing: "1.5px",
//         textTransform: "uppercase",
//         color:         "var(--color-text-accent)",
//         padding:       "0 16px 8px",
//       }}>
//         {title}
//       </p>
//       <div
//         className="rounded-card overflow-hidden"
//         style={{
//           backgroundColor: "var(--color-bg-card)",
//           border:          "1px solid var(--color-border-default)",
//         }}
//       >
//         {children}
//       </div>
//     </div>
//   );
// }

// // ─── Row divider ──────────────────────────────────────────────────────────────
// function RowDivider() {
//   return (
//     <div style={{
//       height:          "1px",
//       backgroundColor: "var(--color-border-default)",
//       margin:          "0 16px",
//       opacity:         0.5,
//     }} />
//   );
// }

// // ─── CDF Toggle row ───────────────────────────────────────────────────────────
// function CdfToggleRow() {
//   const { enabled, isLoading, isUpdating, toggle } = useCdfSettings();

//   return (
//     <div className="flex items-center gap-3" style={{ padding: "13px 16px" }}>
//       <div
//         className="flex items-center justify-center rounded-[8px] flex-shrink-0"
//         style={{
//           width:           "34px",
//           height:          "34px",
//           backgroundColor: enabled
//             ? "rgba(41,182,246,0.15)"
//             : "rgba(21,101,168,0.12)",
//           color: enabled ? "var(--color-today)" : "var(--color-text-hint)",
//         }}
//       >
//         <BarChart2 style={{ width: "16px", height: "16px" }} />
//       </div>

//       <div className="flex-1">
//         <p style={{
//           fontSize:   "var(--text-base)",
//           fontWeight: 500,
//           color:      "var(--color-text-primary)",
//         }}>
//           CDF Tracking
//         </p>
//         <p style={{
//           fontSize:  "var(--text-xs)",
//           color:     enabled ? "var(--color-today)" : "var(--color-text-hint)",
//           marginTop: "1px",
//         }}>
//           {isLoading
//             ? "Loading…"
//             : enabled
//             ? "Consistency · Discipline · Focus"
//             : "Tap to enable tracking"}
//         </p>
//       </div>

//       <button
//         onClick={toggle}
//         disabled={isLoading || isUpdating}
//         aria-label={enabled ? "Disable CDF" : "Enable CDF"}
//         style={{
//           position:        "relative",
//           width:           "50px",
//           height:          "28px",
//           borderRadius:    "14px",
//           backgroundColor: enabled
//             ? "var(--color-today)"
//             : "var(--color-bg-header)",
//           border:     `2px solid ${enabled
//             ? "var(--color-today)"
//             : "var(--color-border-default)"}`,
//           cursor:     isLoading || isUpdating ? "not-allowed" : "pointer",
//           transition: "background-color 0.25s ease, border-color 0.25s ease",
//           flexShrink: 0,
//           opacity:    isLoading || isUpdating ? 0.6 : 1,
//         }}
//       >
//         <div style={{
//           position:        "absolute",
//           top:             "2px",
//           left:            enabled ? "22px" : "2px",
//           width:           "20px",
//           height:          "20px",
//           borderRadius:    "50%",
//           backgroundColor: "#ffffff",
//           boxShadow:       "0 1px 4px rgba(0,0,0,0.3)",
//           transition:      "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
//         }} />
//       </button>
//     </div>
//   );
// }

// // ─── Notification toggle row ──────────────────────────────────────────────────
// function NotificationRow() {
//   // ← Hook called INSIDE component — correct
//   const {
//     permission,
//     isSubscribed,
//     isLoading: notifLoading,
//     subscribe,
//     unsubscribe,
//   } = usePushNotifications();

//   const value =
//     permission === "unsupported" ? "Not supported on this browser"     :
//     permission === "denied"      ? "Blocked — enable in browser settings" :
//     isSubscribed                 ? "On — notified at task due time"    :
//     "Off — tap to enable";

//   const handleClick =
//     permission === "unsupported" || permission === "denied"
//       ? undefined
//       : isSubscribed
//       ? unsubscribe
//       : subscribe;

//   const showToggle =
//     permission !== "unsupported" && permission !== "denied";

//   return (
//     <SettingsRow
//       icon={<Bell style={{ width: "16px", height: "16px" }} />}
//       label="Task Reminders"
//       value={value}
//       onClick={handleClick}
//       rightNode={
//         showToggle ? (
//           <div
//             style={{
//               width:           "44px",
//               height:          "26px",
//               borderRadius:    "13px",
//               backgroundColor: isSubscribed
//                 ? "var(--color-today)"
//                 : "var(--color-bg-header)",
//               border:     `1.5px solid ${isSubscribed
//                 ? "var(--color-today)"
//                 : "var(--color-border-default)"}`,
//               position:   "relative",
//               cursor:     notifLoading ? "not-allowed" : "pointer",
//               opacity:    notifLoading ? 0.6 : 1,
//               transition: "background-color 0.25s ease",
//               flexShrink: 0,
//             }}
//           >
//             <div style={{
//               position:        "absolute",
//               top:             "2px",
//               left:            isSubscribed ? "22px" : "2px",
//               width:           "18px",
//               height:          "18px",
//               borderRadius:    "50%",
//               backgroundColor: "#ffffff",
//               boxShadow:       "0 1px 4px rgba(0,0,0,0.3)",
//               transition:      "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
//             }} />
//           </div>
//         ) : undefined
//       }
//     />
//   );
// }

// // ─── Main page ────────────────────────────────────────────────────────────────
// export default function SettingsPage() {
//   const router = useRouter();
//   const { user, isAuthenticated, isLoading, logout } = useAuth();

//   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [isLoggingOut,      setIsLoggingOut]      = useState(false);

//   useEffect(() => {
//     if (!isLoading && !isAuthenticated) router.push("/login");
//   }, [isAuthenticated, isLoading, router]);

//   // Show spinner while auth loads
//   if (isLoading) {
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

//   // Auth guard — redirect handled by useEffect above
//   // Return spinner instead of null so page doesn't flash blank
//   if (!isAuthenticated) {
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

//   const handleLogout = async () => {
//     if (!showLogoutConfirm) {
//       setShowLogoutConfirm(true);
//       setTimeout(() => setShowLogoutConfirm(false), 3000);
//       return;
//     }
//     setIsLoggingOut(true);
//     await logout();
//     router.push("/login");
//   };

//   return (
//     <div style={{
//       minHeight:       "100dvh",
//       backgroundColor: "var(--color-bg-app)",
//       maxWidth:        "430px",
//       margin:          "0 auto",
//       display:         "flex",
//       flexDirection:   "column",
//     }}>
//       <HeaderBar
//         title="Settings"
//         showBack
//         onBack={() => router.push("/")}
//       />

//       <div
//         className="flex-1 overflow-y-auto scrollbar-hide"
//         style={{ padding: "20px 16px 16px" }}
//       >
//         {/* ── Profile card ──────────────────────────────────────────── */}
//         <div
//           className="flex items-center gap-4 rounded-card mb-5 px-4 py-4"
//           style={{
//             backgroundColor: "var(--color-bg-card)",
//             border:          "1px solid var(--color-border-default)",
//           }}
//         >
//           <div
//             className="flex items-center justify-center rounded-full flex-shrink-0"
//             style={{
//               width:           "52px",
//               height:          "52px",
//               backgroundColor: "var(--color-primary)",
//               fontSize:        "22px",
//               fontWeight:      700,
//               color:           "#ffffff",
//             }}
//           >
//             {user?.name?.charAt(0).toUpperCase() ?? "?"}
//           </div>

//           <div className="flex-1 min-w-0">
//             <p className="truncate" style={{
//               fontSize:   "var(--text-lg)",
//               fontWeight: 700,
//               color:      "var(--color-text-primary)",
//             }}>
//               {user?.name}
//             </p>
//             <p className="truncate" style={{
//               fontSize: "var(--text-sm)",
//               color:    "var(--color-text-hint)",
//             }}>
//               {user?.email}
//             </p>
//             <div className="flex items-center gap-1 mt-1">
//               <div className="w-1.5 h-1.5 rounded-full" style={{
//                 backgroundColor: user?.isVerified
//                   ? "var(--color-success)"
//                   : "var(--color-warning)",
//               }} />
//               <span style={{
//                 fontSize: "var(--text-xs)",
//                 color:    user?.isVerified
//                   ? "var(--color-success)"
//                   : "var(--color-warning)",
//               }}>
//                 {user?.isVerified ? "Verified" : "Not verified"}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* ── CDF Tracking ──────────────────────────────────────────── */}
//         <SettingsSection title="CDF Tracking">
//           <CdfToggleRow />
//           <RowDivider />
//           <SettingsRow
//             icon={<BarChart2 style={{ width: "16px", height: "16px" }} />}
//             label="View CDF Dashboard"
//             value="Scores · History · Streaks"
//             onClick={() => router.push("/cdf")}
//           />
//         </SettingsSection>

//         {/* ── Notifications ─────────────────────────────────────────── */}
//        <SettingsSection title="Notifications">
//         <SettingsRow
//           icon={<Bell style={{ width: "16px", height: "16px" }} />}
//           label="Task Reminders"
//           value={
//             permission === "unsupported" ? "Not supported on this browser" :
//             permission === "denied"      ? "Blocked — enable in browser settings" :
//             isSubscribed                 ? "On — you'll be notified at task due time" :
//             "Off — tap to enable"
//           }
//           onClick={
//             permission === "unsupported" || permission === "denied"
//               ? undefined
//               : isSubscribed
//               ? unsubscribe
//               : subscribe
//           }
//           rightNode={
//             permission !== "unsupported" && permission !== "denied" ? (
//               <div
//                 style={{
//                   width:           "44px",
//             height:          "26px",
//             borderRadius:    "13px",
//             backgroundColor: isSubscribed
//               ? "var(--color-today)"
//               : "var(--color-bg-header)",
//             border:          `1.5px solid ${isSubscribed
//               ? "var(--color-today)"
//               : "var(--color-border-default)"}`,
//             position:        "relative",
//             cursor:          notifLoading ? "not-allowed" : "pointer",
//             opacity:         notifLoading ? 0.6 : 1,
//             transition:      "background-color 0.25s ease",
//             flexShrink:      0,
//           }}
//           onClick={isSubscribed ? unsubscribe : subscribe}
//         >
//           <div style={{
//             position:        "absolute",
//             top:             "2px",
//             left:            isSubscribed ? "18px" : "2px",
//             width:           "18px",
//             height:          "18px",
//             borderRadius:    "50%",
//             backgroundColor: "#ffffff",
//             boxShadow:       "0 1px 4px rgba(0,0,0,0.3)",
//             transition:      "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
//           }} />
//         </div>
//       ) : undefined
//     }
//   />
// </SettingsSection>

//         {/* ── Account ───────────────────────────────────────────────── */}
//         <SettingsSection title="Account">
//           <SettingsRow
//             icon={<Shield style={{ width: "16px", height: "16px" }} />}
//             label="Change Password"
//             onClick={() => router.push("/forgot-password")}
//           />
//           <RowDivider />
//           <SettingsRow
//             icon={<Mail style={{ width: "16px", height: "16px" }} />}
//             label="Email"
//             value={user?.email ?? ""}
//           />
//         </SettingsSection>

//         {/* ── App ───────────────────────────────────────────────────── */}
//         <SettingsSection title="App">
//           <SettingsRow
//             icon={<Moon style={{ width: "16px", height: "16px" }} />}
//             label="Theme"
//             value="Dark (default)"
//           />
//           <RowDivider />
//           <SettingsRow
//             icon={<Info style={{ width: "16px", height: "16px" }} />}
//             label="Version"
//             value="TaskFlow v1.0.0"
//           />
//         </SettingsSection>

//         {/* ── Account Actions ───────────────────────────────────────── */}
//         <SettingsSection title="Account Actions">
//           <SettingsRow
//             icon={<LogOut style={{ width: "16px", height: "16px" }} />}
//             label={
//               showLogoutConfirm ? "Tap again to confirm logout" :
//               isLoggingOut      ? "Logging out…"                :
//               "Log Out"
//             }
//             danger={showLogoutConfirm}
//             onClick={handleLogout}
//           />
//           <RowDivider />
//           <SettingsRow
//             icon={<Trash2 style={{ width: "16px", height: "16px" }} />}
//             label={
//               showDeleteConfirm
//                 ? "Are you sure? This cannot be undone"
//                 : "Delete Account"
//             }
//             danger
//             onClick={() => {
//               if (!showDeleteConfirm) {
//                 setShowDeleteConfirm(true);
//                 setTimeout(() => setShowDeleteConfirm(false), 4000);
//               }
//             }}
//           />
//         </SettingsSection>
//       </div>

//       <BottomNav
//         screen="settings"
//         hasOverdue={false}
//         quickAddOpen={false}
//         onHome={() => router.push("/")}
//         onAdd={() => router.push("/")}
//         onLists={() => router.push("/")}
//         onSettings={() => {}}
//       />
//     </div>
//   );
// }

// app/settings/page.tsx
"use client";

import { useEffect, useState }      from "react";
import { useRouter }                from "next/navigation";
import { useAuth }                  from "@/hooks/useAuth";
import { useCdfSettings }           from "@/hooks/useCdfSettings";
import { usePushNotifications }     from "@/hooks/usePushNotifications";
import { HeaderBar }                from "@/components/layout/HeaderBar";
import { BottomNav }                from "@/components/layout/BottomNav";
import {
  Bell, Shield, ChevronRight,
  LogOut, Trash2, BarChart2,
  Moon, Info, Mail,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SettingsRowProps {
  icon:       React.ReactNode;
  label:      string;
  value?:     string;
  onClick?:   () => void;
  danger?:    boolean;
  rightNode?: React.ReactNode;
}

interface SettingsSectionProps {
  title:    string;
  children: React.ReactNode;
}

// ─── Settings row ─────────────────────────────────────────────────────────────
function SettingsRow({
  icon, label, value, onClick, danger, rightNode,
}: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick && !rightNode}
      className="w-full flex items-center gap-3 active:scale-[0.99] transition-transform"
      style={{
        padding:         "13px 16px",
        backgroundColor: "transparent",
        border:          "none",
        cursor:          onClick ? "pointer" : "default",
        textAlign:       "left",
      }}
    >
      <div
        className="flex items-center justify-center rounded-[8px] flex-shrink-0"
        style={{
          width:           "34px",
          height:          "34px",
          backgroundColor: danger
            ? "rgba(229,57,53,0.12)"
            : "rgba(21,101,168,0.15)",
          color: danger ? "var(--color-overdue)" : "var(--color-accent)",
        }}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p style={{
          fontSize:   "var(--text-base)",
          fontWeight: 500,
          color:      danger
            ? "var(--color-overdue)"
            : "var(--color-text-primary)",
        }}>
          {label}
        </p>
        {value && (
          <p style={{
            fontSize:  "var(--text-xs)",
            color:     "var(--color-text-hint)",
            marginTop: "1px",
          }}>
            {value}
          </p>
        )}
      </div>

      {rightNode ?? (onClick && (
        <ChevronRight style={{
          width:      "16px",
          height:     "16px",
          color:      "var(--color-text-hint)",
          flexShrink: 0,
        }} />
      ))}
    </button>
  );
}

// ─── Settings section ─────────────────────────────────────────────────────────
function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{
        fontSize:      "var(--text-xs)",
        fontWeight:    700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color:         "var(--color-text-accent)",
        padding:       "0 16px 8px",
      }}>
        {title}
      </p>
      <div
        className="rounded-card overflow-hidden"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border:          "1px solid var(--color-border-default)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Row divider ──────────────────────────────────────────────────────────────
function RowDivider() {
  return (
    <div style={{
      height:          "1px",
      backgroundColor: "var(--color-border-default)",
      margin:          "0 16px",
      opacity:         0.5,
    }} />
  );
}

// ─── CDF Toggle row ───────────────────────────────────────────────────────────
function CdfToggleRow() {
  const { enabled, isLoading, isUpdating, toggle } = useCdfSettings();

  return (
    <div className="flex items-center gap-3" style={{ padding: "13px 16px" }}>
      <div
        className="flex items-center justify-center rounded-[8px] flex-shrink-0"
        style={{
          width:           "34px",
          height:          "34px",
          backgroundColor: enabled
            ? "rgba(41,182,246,0.15)"
            : "rgba(21,101,168,0.12)",
          color: enabled ? "var(--color-today)" : "var(--color-text-hint)",
        }}
      >
        <BarChart2 style={{ width: "16px", height: "16px" }} />
      </div>

      <div className="flex-1">
        <p style={{
          fontSize:   "var(--text-base)",
          fontWeight: 500,
          color:      "var(--color-text-primary)",
        }}>
          CDF Tracking
        </p>
        <p style={{
          fontSize:  "var(--text-xs)",
          color:     enabled ? "var(--color-today)" : "var(--color-text-hint)",
          marginTop: "1px",
        }}>
          {isLoading
            ? "Loading…"
            : enabled
            ? "Consistency · Discipline · Focus"
            : "Tap to enable tracking"}
        </p>
      </div>

      <button
        onClick={toggle}
        disabled={isLoading || isUpdating}
        aria-label={enabled ? "Disable CDF" : "Enable CDF"}
        style={{
          position:        "relative",
          width:           "50px",
          height:          "28px",
          borderRadius:    "14px",
          backgroundColor: enabled
            ? "var(--color-today)"
            : "var(--color-bg-header)",
          border:     `2px solid ${enabled
            ? "var(--color-today)"
            : "var(--color-border-default)"}`,
          cursor:     isLoading || isUpdating ? "not-allowed" : "pointer",
          transition: "background-color 0.25s ease, border-color 0.25s ease",
          flexShrink: 0,
          opacity:    isLoading || isUpdating ? 0.6 : 1,
        }}
      >
        <div style={{
          position:        "absolute",
          top:             "2px",
          left:            enabled ? "22px" : "2px",
          width:           "20px",
          height:          "20px",
          borderRadius:    "50%",
          backgroundColor: "#ffffff",
          boxShadow:       "0 1px 4px rgba(0,0,0,0.3)",
          transition:      "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </button>
    </div>
  );
}

// ─── Notification toggle row ──────────────────────────────────────────────────
function NotificationRow() {
  // ← Hook called INSIDE component — correct
  const {
    permission,
    isSubscribed,
    isLoading: notifLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const value =
    permission === "unsupported" ? "Not supported on this browser"     :
    permission === "denied"      ? "Blocked — enable in browser settings" :
    isSubscribed                 ? "On — notified at task due time"    :
    "Off — tap to enable";

  const handleClick =
    permission === "unsupported" || permission === "denied"
      ? undefined
      : isSubscribed
      ? unsubscribe
      : subscribe;

  const showToggle =
    permission !== "unsupported" && permission !== "denied";

  return (
    <SettingsRow
      icon={<Bell style={{ width: "16px", height: "16px" }} />}
      label="Task Reminders"
      value={value}
      onClick={handleClick}
      rightNode={
        showToggle ? (
          <div
            style={{
              width:           "44px",
              height:          "26px",
              borderRadius:    "13px",
              backgroundColor: isSubscribed
                ? "var(--color-today)"
                : "var(--color-bg-header)",
              border:     `1.5px solid ${isSubscribed
                ? "var(--color-today)"
                : "var(--color-border-default)"}`,
              position:   "relative",
              cursor:     notifLoading ? "not-allowed" : "pointer",
              opacity:    notifLoading ? 0.6 : 1,
              transition: "background-color 0.25s ease",
              flexShrink: 0,
            }}
          >
            <div style={{
              position:        "absolute",
              top:             "2px",
              left:            isSubscribed ? "22px" : "2px",
              width:           "18px",
              height:          "18px",
              borderRadius:    "50%",
              backgroundColor: "#ffffff",
              boxShadow:       "0 1px 4px rgba(0,0,0,0.3)",
              transition:      "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            }} />
          </div>
        ) : undefined
      }
    />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoggingOut,      setIsLoggingOut]      = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  // Show spinner while auth loads
  if (isLoading) {
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

  // Auth guard — redirect handled by useEffect above
  // Return spinner instead of null so page doesn't flash blank
  if (!isAuthenticated) {
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

  const handleLogout = async () => {
    if (!showLogoutConfirm) {
      setShowLogoutConfirm(true);
      setTimeout(() => setShowLogoutConfirm(false), 3000);
      return;
    }
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  };

  return (
    <div style={{
      minHeight:       "100dvh",
      backgroundColor: "var(--color-bg-app)",
      maxWidth:        "430px",
      margin:          "0 auto",
      display:         "flex",
      flexDirection:   "column",
    }}>
      <HeaderBar
        title="Settings"
        showBack
        onBack={() => router.push("/")}
      />

      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ padding: "20px 16px 16px" }}
      >
        {/* ── Profile card ──────────────────────────────────────────── */}
        <div
          className="flex items-center gap-4 rounded-card mb-5 px-4 py-4"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border:          "1px solid var(--color-border-default)",
          }}
        >
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width:           "52px",
              height:          "52px",
              backgroundColor: "var(--color-primary)",
              fontSize:        "22px",
              fontWeight:      700,
              color:           "#ffffff",
            }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate" style={{
              fontSize:   "var(--text-lg)",
              fontWeight: 700,
              color:      "var(--color-text-primary)",
            }}>
              {user?.name}
            </p>
            <p className="truncate" style={{
              fontSize: "var(--text-sm)",
              color:    "var(--color-text-hint)",
            }}>
              {user?.email}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{
                backgroundColor: user?.isVerified
                  ? "var(--color-success)"
                  : "var(--color-warning)",
              }} />
              <span style={{
                fontSize: "var(--text-xs)",
                color:    user?.isVerified
                  ? "var(--color-success)"
                  : "var(--color-warning)",
              }}>
                {user?.isVerified ? "Verified" : "Not verified"}
              </span>
            </div>
          </div>
        </div>

        {/* ── CDF Tracking ──────────────────────────────────────────── */}
        <SettingsSection title="CDF Tracking">
          <CdfToggleRow />
          <RowDivider />
          <SettingsRow
            icon={<BarChart2 style={{ width: "16px", height: "16px" }} />}
            label="View CDF Dashboard"
            value="Scores · History · Streaks"
            onClick={() => router.push("/cdf")}
          />
        </SettingsSection>

        {/* ── Notifications ─────────────────────────────────────────── */}
        <SettingsSection title="Notifications">
          <NotificationRow />
        </SettingsSection>

        {/* ── Account ───────────────────────────────────────────────── */}
        <SettingsSection title="Account">
          <SettingsRow
            icon={<Shield style={{ width: "16px", height: "16px" }} />}
            label="Change Password"
            onClick={() => router.push("/forgot-password")}
          />
          <RowDivider />
          <SettingsRow
            icon={<Mail style={{ width: "16px", height: "16px" }} />}
            label="Email"
            value={user?.email ?? ""}
          />
        </SettingsSection>

        {/* ── App ───────────────────────────────────────────────────── */}
        <SettingsSection title="App">
          <SettingsRow
            icon={<Moon style={{ width: "16px", height: "16px" }} />}
            label="Theme"
            value="Dark (default)"
          />
          <RowDivider />
          <SettingsRow
            icon={<Info style={{ width: "16px", height: "16px" }} />}
            label="Version"
            value="TaskFlow v1.0.0"
          />
        </SettingsSection>

        {/* ── Account Actions ───────────────────────────────────────── */}
        <SettingsSection title="Account Actions">
          <SettingsRow
            icon={<LogOut style={{ width: "16px", height: "16px" }} />}
            label={
              showLogoutConfirm ? "Tap again to confirm logout" :
              isLoggingOut      ? "Logging out…"                :
              "Log Out"
            }
            danger={showLogoutConfirm}
            onClick={handleLogout}
          />
          <RowDivider />
          <SettingsRow
            icon={<Trash2 style={{ width: "16px", height: "16px" }} />}
            label={
              showDeleteConfirm
                ? "Are you sure? This cannot be undone"
                : "Delete Account"
            }
            danger
            onClick={() => {
              if (!showDeleteConfirm) {
                setShowDeleteConfirm(true);
                setTimeout(() => setShowDeleteConfirm(false), 4000);
              }
            }}
          />
        </SettingsSection>
      </div>

      <BottomNav
        screen="settings"
        hasOverdue={false}
        quickAddOpen={false}
        onHome={() => router.push("/")}
        onAdd={() => router.push("/")}
        onLists={() => router.push("/")}
        onSettings={() => {}}
      />
    </div>
  );
}