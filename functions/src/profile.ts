import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin.js";

/**
 * Idempotent self-heal for the profile doc. The client already writes
 * users/{uid} right after sign-up; this callable is invoked on every
 * login as a defensive backstop in case that write was ever interrupted
 * (e.g. network drop between auth success and the Firestore write).
 */
export const ensureProfile = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();

  if (snap.exists) {
    return { created: false };
  }

  const email = request.auth?.token.email ?? null;
  const fullName = (request.auth?.token.name as string | undefined) ?? null;

  await ref.set({
    fullName,
    email,
    avatarUrl: null,
    planType: "family",
    fcmTokens: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { created: true };
});
