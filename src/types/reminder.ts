export type ReminderCategory = "appointment" | "document" | "subscription" | "personal" | "custom";
export type ReminderPriority = "low" | "medium" | "high";
export type NotificationPreference = "app" | "whatsapp" | "email";

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

export interface FamilyMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
