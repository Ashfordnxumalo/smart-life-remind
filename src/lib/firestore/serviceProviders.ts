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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  NewServiceProvider,
  ProviderReference,
  ServiceProvider,
  ServiceProviderUpdate,
} from "@/types/serviceProvider";
import { toISO } from "./utils";

const providersCollection = (uid: string) =>
  collection(db, "users", uid, "serviceProviders");

const providerDoc = (uid: string, id: string) =>
  doc(db, "users", uid, "serviceProviders", id);

const fromSnapshot = (
  id: string,
  data: Record<string, unknown>
): ServiceProvider => ({
  id,
  service: (data.service as string) ?? "",
  category: (data.category as string) ?? "Other",
  providerName: (data.providerName as string) ?? "",
  contactName: (data.contactName as string) ?? null,
  phone: (data.phone as string) ?? null,
  email: (data.email as string) ?? null,
  website: (data.website as string) ?? null,
  // Older documents predate references; treat a missing array as empty rather
  // than letting undefined reach the UI.
  references: Array.isArray(data.references)
    ? (data.references as ProviderReference[]).filter((r) => r && r.label)
    : [],
  notes: (data.notes as string) ?? null,
  lastServicedOn: (data.lastServicedOn as string) ?? null,
  nextDueOn: (data.nextDueOn as string) ?? null,
  createdAt: toISO(data.createdAt) ?? "",
  updatedAt: toISO(data.updatedAt) ?? "",
});

export const subscribeToServiceProviders = (
  uid: string,
  onData: (providers: ServiceProvider[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(providersCollection(uid), orderBy("category", "asc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => fromSnapshot(d.id, d.data()))),
    (error) => onError?.(error)
  );
};

export const createServiceProvider = async (
  uid: string,
  data: NewServiceProvider
) => {
  const ref = await addDoc(providersCollection(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateServiceProvider = async (
  uid: string,
  id: string,
  data: ServiceProviderUpdate
) => {
  await updateDoc(providerDoc(uid, id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteServiceProvider = async (uid: string, id: string) => {
  await deleteDoc(providerDoc(uid, id));
};
