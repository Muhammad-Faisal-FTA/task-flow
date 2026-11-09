import type { TaskShareSnapshot } from "@/types/task";

export interface ShareableUser {
  id: string;
  name: string;
  email: string;
}

export interface ShareAllowListUser extends ShareableUser {
  allowed: boolean;
}

export interface TaskShareInvitation {
  id: string;
  snapshot: TaskShareSnapshot;
  createdAt: string;
  senderName: string;
  senderEmail: string;
}
