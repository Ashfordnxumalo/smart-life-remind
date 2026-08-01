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
  LoyaltyCard,
  LoyaltyCardUpdate,
  NewLoyaltyCard,
} from "@/types/loyaltyCard";
import { toISO } from "./utils";

const cardsCollection = (uid: string) => collection(db, "users", uid, "loyaltyCards");
const cardDoc = (uid: string, id: string) => doc(db, "users", uid, "loyaltyCards", id);

const fromSnapshot = (id: string, data: Record<string, unknown>): LoyaltyCard => ({
  id,
  retailer: (data.retailer as string) ?? "",
  cardNumber: (data.cardNumber as string) ?? "",
  barcodeFormat: (data.barcodeFormat as LoyaltyCard["barcodeFormat"]) ?? "CODE128",
  color: (data.color as LoyaltyCard["color"]) ?? "indigo",
  notes: (data.notes as string) ?? null,
  createdAt: toISO(data.createdAt) ?? "",
  updatedAt: toISO(data.updatedAt) ?? "",
});

export const subscribeToLoyaltyCards = (
  uid: string,
  onData: (cards: LoyaltyCard[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(cardsCollection(uid), orderBy("retailer", "asc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => fromSnapshot(d.id, d.data()))),
    (error) => onError?.(error)
  );
};

export const createLoyaltyCard = async (uid: string, data: NewLoyaltyCard) => {
  const ref = await addDoc(cardsCollection(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateLoyaltyCard = async (
  uid: string,
  id: string,
  data: LoyaltyCardUpdate
) => {
  await updateDoc(cardDoc(uid, id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteLoyaltyCard = async (uid: string, id: string) => {
  await deleteDoc(cardDoc(uid, id));
};
