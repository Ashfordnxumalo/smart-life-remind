import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const updateCurrentLocation = async (
  uid: string,
  data: { latitude: number; longitude: number; accuracy: number | null }
) => {
  await setDoc(
    doc(db, "users", uid, "locationState", "current"),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
};
