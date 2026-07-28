import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import type { FamilyMember } from "@/types/reminder";
import { toISO } from "./utils";

const membersCollection = (uid: string) => collection(db, "users", uid, "familyMembers");

export const subscribeToFamilyMembers = (
  uid: string,
  onData: (members: FamilyMember[]) => void
) => {
  const q = query(membersCollection(uid), where("isActive", "==", true), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    onData(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          email: data.email ?? null,
          phone: data.phone ?? null,
          relationship: data.relationship ?? null,
          avatarUrl: data.avatarUrl ?? null,
          isActive: data.isActive,
          createdAt: toISO(data.createdAt) ?? "",
          updatedAt: toISO(data.updatedAt) ?? "",
        } satisfies FamilyMember;
      })
    );
  });
};

interface FamilyMemberInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  relationship?: string | null;
}

const addFamilyMemberCallable = httpsCallable<FamilyMemberInput, { id: string }>(functions, "addFamilyMember");
const updateFamilyMemberCallable = httpsCallable<FamilyMemberInput & { id: string }, { id: string }>(
  functions,
  "updateFamilyMember"
);
const removeFamilyMemberCallable = httpsCallable<{ id: string }, { id: string }>(functions, "removeFamilyMember");

export const addFamilyMember = async (input: FamilyMemberInput) => {
  const result = await addFamilyMemberCallable(input);
  return result.data.id;
};

export const updateFamilyMember = async (id: string, input: FamilyMemberInput) => {
  await updateFamilyMemberCallable({ id, ...input });
};

export const removeFamilyMember = async (id: string) => {
  await removeFamilyMemberCallable({ id });
};
