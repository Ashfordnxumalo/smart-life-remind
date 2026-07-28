import { Timestamp } from "firebase/firestore";

export const toISO = (value: unknown): string | null => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
};
