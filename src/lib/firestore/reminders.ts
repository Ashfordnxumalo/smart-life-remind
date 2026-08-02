import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sanitizeNotificationPreferences } from "@/types/reminder";
import type { NewReminder, Reminder, ReminderUpdate } from "@/types/reminder";
import { toISO } from "./utils";

const remindersCollection = (uid: string) => collection(db, "users", uid, "reminders");
const reminderDoc = (uid: string, id: string) => doc(db, "users", uid, "reminders", id);

const fromSnapshot = (id: string, data: Record<string, unknown>): Reminder => ({
  id,
  title: data.title as string,
  description: (data.description as string) ?? "",
  category: data.category as Reminder["category"],
  priority: data.priority as Reminder["priority"],
  dueDate: data.dueDate as string,
  dueTime: (data.dueTime as string) ?? null,
  completed: Boolean(data.completed),
  completedAt: toISO(data.completedAt),
  assignedMemberId: (data.assignedMemberId as string) ?? null,
  assignedUid: (data.assignedUid as string) ?? null,
  reminderLocation: (data.reminderLocation as string) ?? null,
  locationLat: (data.locationLat as number) ?? null,
  locationLng: (data.locationLng as number) ?? null,
  locationRadius: (data.locationRadius as number) ?? 500,
  notificationPreferences: sanitizeNotificationPreferences(data.notificationPreferences),
  createdAt: toISO(data.createdAt) ?? "",
  updatedAt: toISO(data.updatedAt) ?? "",
});

export const subscribeToReminders = (uid: string, onData: (reminders: Reminder[]) => void) => {
  const q = query(remindersCollection(uid), orderBy("dueDate", "asc"));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => fromSnapshot(d.id, d.data())));
  });
};

/**
 * Reminders another account has assigned to this user. Firestore can't query
 * across users, so this targets one owner's collection at a time — the caller
 * runs it per linked account.
 */
export const subscribeToAssignedReminders = (
  ownerUid: string,
  assigneeUid: string,
  onData: (reminders: Reminder[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    remindersCollection(ownerUid),
    where("assignedUid", "==", assigneeUid),
    orderBy("dueDate", "asc")
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => fromSnapshot(d.id, d.data()))),
    (error) => onError?.(error)
  );
};

export const createReminder = async (uid: string, data: NewReminder) => {
  const ref = await addDoc(remindersCollection(uid), {
    ...data,
    completed: false,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateReminder = async (uid: string, id: string, data: ReminderUpdate) => {
  await updateDoc(reminderDoc(uid, id), { ...data, updatedAt: serverTimestamp() });
};

export const completeReminder = async (uid: string, id: string) => {
  await updateDoc(reminderDoc(uid, id), {
    completed: true,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const reopenReminder = async (uid: string, id: string) => {
  await updateDoc(reminderDoc(uid, id), {
    completed: false,
    completedAt: null,
    updatedAt: serverTimestamp(),
  });
};

export const postponeReminder = async (uid: string, id: string, currentDueDate: string) => {
  const next = new Date(`${currentDueDate}T00:00:00`);
  next.setDate(next.getDate() + 1);
  const nextDueDate = next.toISOString().split("T")[0];
  await updateDoc(reminderDoc(uid, id), { dueDate: nextDueDate, updatedAt: serverTimestamp() });
};

export const deleteReminder = async (uid: string, id: string) => {
  await deleteDoc(reminderDoc(uid, id));
};
