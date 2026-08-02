export type ReminderCategory = "appointment" | "document" | "subscription" | "personal" | "custom";
export type ReminderPriority = "low" | "medium" | "high";
export type NotificationPreference = "app" | "email";

export const NOTIFICATION_PREFERENCES: NotificationPreference[] = ["app", "email"];

/**
 * Reminders saved while WhatsApp was still an option carry "whatsapp" in this
 * array, and nothing rewrites old documents — so unsupported values are
 * dropped on read. Falls back to in-app so a reminder always has one channel.
 */
export const sanitizeNotificationPreferences = (
  value: unknown
): NotificationPreference[] => {
  const list = Array.isArray(value) ? value : [];
  const valid = list.filter((entry): entry is NotificationPreference =>
    NOTIFICATION_PREFERENCES.includes(entry as NotificationPreference)
  );
  return valid.length > 0 ? valid : ["app"];
};

export interface Reminder {
  id: string;
  title: string;
  description: string;
  category: ReminderCategory;
  priority: ReminderPriority;
  dueDate: string; // 'YYYY-MM-DD'
  dueTime: string | null; // 'HH:mm', null = all-day
  completed: boolean;
  completedAt: string | null;
  assignedMemberId: string | null;
  reminderLocation: string | null;
  locationLat: number | null;
  locationLng: number | null;
  locationRadius: number;
  notificationPreferences: NotificationPreference[];
  createdAt: string;
  updatedAt: string;
}

export type NewReminder = Omit<Reminder, "id" | "completed" | "completedAt" | "createdAt" | "updatedAt">;
export type ReminderUpdate = Partial<Omit<Reminder, "id" | "createdAt">>;

/**
 * 'none'    — no address on file, or the invitation failed to send
 * 'invited' — invitation emailed, not yet accepted
 * 'linked'  — accepted; both accounts point at each other and can share cards
 */
export type MemberLinkStatus = "none" | "invited" | "linked";

export interface FamilyMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  linkStatus: MemberLinkStatus;
  /** The member's own account, once they've accepted. */
  linkedUid: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Another account this user is linked to, from users/{uid}/linkedMembers. */
export interface LinkedMember {
  uid: string;
  displayName: string;
  email: string | null;
  linkedAt: string;
}

export type PlanType = "family" | "business";

export interface UserProfile {
  uid: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  planType: PlanType;
  fcmTokens: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  recipientMemberId: string;
  reminderId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  pushNotifications: boolean;
  emailNotifications: boolean;
  locationTracking: boolean;
}
