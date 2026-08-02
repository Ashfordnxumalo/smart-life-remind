import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { db } from "./admin.js";
import { EMAIL_SECRETS } from "./email.js";
import { createAndSendInvite } from "./invitations.js";

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

export const addFamilyMember = onCall<AddFamilyMemberInput>(
  { secrets: EMAIL_SECRETS },
  async (request) => {
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

    let inviterName = "A Smart R user";

    await db.runTransaction(async (tx) => {
      const profileSnap = await tx.get(profileRef);
      const planType = (profileSnap.data()?.planType as string) ?? "family";
      const maxMembers = PLAN_LIMITS[planType] ?? PLAN_LIMITS.family;
      inviterName = (profileSnap.data()?.fullName as string) || inviterName;

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
        // 'none' until an address exists to invite; 'invited' once the mail is
        // away; 'linked' once they accept and both accounts point at each other.
        linkStatus: email ? "invited" : "none",
        linkedUid: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // Outside the transaction: sending mail is not rollback-able, and a mail
    // failure must not undo a member the user successfully added.
    let invited = false;
    if (email) {
      try {
        await createAndSendInvite({
          inviterUid: uid,
          inviterName,
          memberId: newMemberRef.id,
          inviteeName: name.trim(),
          inviteeEmail: email,
        });
        invited = true;
      } catch (error) {
        logger.error("Invitation failed to send", { uid, memberId: newMemberRef.id, error });
        await newMemberRef.update({ linkStatus: "none" });
      }
    }

    return { id: newMemberRef.id, invited };
  }
);

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
  const snap = await ref.get();
  const linkedUid = (snap.data()?.linkedUid as string | null) ?? null;

  const batch = db.batch();
  batch.update(ref, {
    isActive: false,
    linkStatus: "none",
    linkedUid: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Tear the link down on both sides, or the removed member would keep seeing
  // this account's shared cards.
  if (linkedUid) {
    batch.delete(db.doc(`users/${uid}/linkedMembers/${linkedUid}`));
    batch.delete(db.doc(`users/${linkedUid}/linkedMembers/${uid}`));
  }

  await batch.commit();

  return { id };
});
