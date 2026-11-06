export type AdminRole = "user" | "admin";
export type FeatureKey = "tasks" | "lists" | "cdf" | "notifications";
export type ServiceKey = "email" | "push";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  role: AdminRole;
}

export interface AdminPermission {
  userId: string;
  feature: FeatureKey;
  enabled: boolean;
}

export interface AdminService {
  service: ServiceKey;
  enabled: boolean;
}

export interface AdminSnapshot {
  users: AdminUser[];
  permissions: AdminPermission[];
  services: AdminService[];
}

export interface AdminSession {
  token: string;
  userId: string;
  email: string;
}

export const FEATURES: Array<{ key: FeatureKey; label: string; description: string }> = [
  { key: "tasks", label: "Tasks", description: "Create, update, and complete tasks." },
  { key: "lists", label: "Lists", description: "Organize tasks into personal lists." },
  { key: "cdf", label: "CDF insights", description: "Track consistency, discipline, and focus." },
  { key: "notifications", label: "Notifications", description: "Receive eligible browser reminders." },
];

export const SERVICE_INFO: Record<ServiceKey, { label: string; description: string }> = {
  email: {
    label: "Email delivery",
    description: "Platform switch for outgoing verification and password reset email.",
  },
  push: {
    label: "Web Push",
    description: "Controls scheduled browser push reminders for eligible users.",
  },
};
