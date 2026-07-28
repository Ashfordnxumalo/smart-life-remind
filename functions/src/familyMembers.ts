import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin.js";

const PLAN_LIMITS: Record<string, number> = {
  family: 5,
  business: 15,
};

interface AddFamilyMemberInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  relationship?: string | null;
}

export const addFamilyMember = onCall<AddFamilyMemberInput>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { name, email = null, phone = null, relationship = null } = request.data;
  if (!name || !name.trim()) {
    throw new HttpsError("invalid-argument", "Name is required.");
  }

  const profileRef = db.doc(`users/${uid}`);
  const membersRef = db.collection(`users/${uid}/familyMembers`);
  const newMemberRef = membersRef.doc();

  await db.runTransaction(async (tx) => {
    const profileSnap = await tx.get(profileRef);
    const planType = (profileSnap.data()?.planType as string) ?? "family";
    const maxMembers = PLAN_LIMITS[planType] ?? PLAN_LIMITS.family;

    const activeCountSnap = await tx.get(membersRef.where("isActive", "==", true));
    if (activeCountSnap.size >= maxMembers) {
      throw new HttpsError(
        "resource-exhausted",
        `Maximum of ${maxMembers} active members allowed for your ${planType} plan.`
      );
    }

    tx.set(newMemberRef, {
      name: name.trim(),
      email,
      phone,
      relationship,
      avatarUrl: null,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { id: newMemberRef.id };
});

interface UpdateFamilyMemberInput {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  relationship?: string | null;
}

export const updateFamilyMember = onCall<UpdateFamilyMemberInput>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { id, name, email = null, phone = null, relationship = null } = request.data;
  if (!id || !name || !name.trim()) {
    throw new HttpsError("invalid-argument", "Member id and name are required.");
  }

  const ref = db.doc(`users/${uid}/familyMembers/${id}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Family member not found.");
  }

  await ref.update({
    name: name.trim(),
    email,
    phone,
    relationship,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id };
});

interface RemoveFamilyMemberInput {
  id: string;
}

export const removeFamilyMember = onCall<RemoveFamilyMemberInput>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { id } = request.data;
  if (!id) {
    throw new HttpsError("invalid-argument", "Member id is required.");
  }

  const ref = db.doc(`users/${uid}/familyMembers/${id}`);
  await ref.update({ isActive: false, updatedAt: FieldValue.serverTimestamp() });

  return { id };
});
