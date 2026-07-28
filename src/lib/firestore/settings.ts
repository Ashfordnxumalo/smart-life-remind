import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserSettings } from "@/types/reminder";

const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  pushNotifications: true,
  emailNotifications: false,
  locationTracking: true,
};

const settingsRef = (uid: string) => doc(db, "users", uid, "settings", "preferences");

export const getSettings = async (uid: string): Promise<UserSettings> => {
  const snap = await getDoc(settingsRef(uid));
  if (!snap.exists()) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...snap.data() } as UserSettings;
};

export const saveSettings = async (uid: string, settings: UserSettings) => {
  await setDoc(settingsRef(uid), settings, { merge: true });
};
