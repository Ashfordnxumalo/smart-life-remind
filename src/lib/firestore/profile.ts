import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PlanType, UserProfile } from "@/types/reminder";
import { toISO } from "./utils";

const profileRef = (uid: string) => doc(db, "users", uid);

export const createProfile = async (
  uid: string,
  data: { fullName: string | null; email: string | null; planType: PlanType }
) => {
  await setDoc(profileRef(uid), {
    fullName: data.fullName,
    email: data.email,
    avatarUrl: null,
    planType: data.planType,
    fcmTokens: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(profileRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    fullName: data.fullName ?? null,
    email: data.email ?? null,
    avatarUrl: data.avatarUrl ?? null,
    planType: data.planType ?? "family",
    fcmTokens: data.fcmTokens ?? [],
    createdAt: toISO(data.createdAt) ?? "",
    updatedAt: toISO(data.updatedAt) ?? "",
  };
};

export const updateProfile = async (uid: string, data: Partial<Pick<UserProfile, "fullName" | "avatarUrl">>) => {
  await updateDoc(profileRef(uid), { ...data, updatedAt: serverTimestamp() });
};
