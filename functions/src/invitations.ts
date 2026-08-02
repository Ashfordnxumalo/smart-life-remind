import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { randomBytes } from "node:crypto";
import { db } from "./admin.js";
import { EMAIL_SECRETS, sendFamilyInviteEmail } from "./email.js";

const INVITE_TTL_DAYS = 14;

/**
 * Invitations live in a top-level collection keyed by an unguessable token and
 * are never client-readable â€” they carry both parties' email addresses, and
 * the token is the only thing standing between a stranger and a link into
 * someone's family. Everything goes through the callables below.
 */
const invitationRef = (token: string) => db.doc(`invitations/${token}`);

const newToken = () => randomBytes(24).toString("base64url");

export interface InvitePreview {
  inviterName: string;
  inviteeName: string;
  inviteeEmail: string;
  status: "pending" | "accepted" | "revoked" | "expired";
}

/**
 * Creates the invitation and emails it. Called from addFamilyMember rather
 * than exported to the client, so an invitation can only ever come from
 * actually adding a member.
 */
export const createAndSendInvite = async (args: {
  inviterUid: string;
  inviterName: string;
  memberId: string;
  inviteeName: string;
  inviteeEmail: string;
}) => {
  const token = newToken();
  const expiresAt = Timestamp.fromMillis(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await invitationRef(token).set({
    inviterUid: args.inviterUid,
    inviterName: args.inviterName,
    memberId: args.memberId,
    inviteeName: args.inviteeName,
    inviteeEmail: args.inviteeEmail.toLowerCase(),
    status: "pending",
    acceptedByUid: null,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
  });

  await sendFamilyInviteEmail({
    to: args.inviteeEmail,
    inviteeName: args.inviteeName,
    inviterName: args.inviterName,
    token,
  });

  return token;
};

/**
 * Shown on the invite page before the recipient signs in, so they can see who
 * is inviting them rather than being asked to authenticate on blind faith.
 * Deliberately unauthenticated â€” possession of the token is the credential â€”
 * and returns only what the page needs to render.
 */
export const getInvitePreview = onCall<{ token: string }>(async (request) => {
  const token = request.data?.token;
  if (!token) throw new HttpsError("invalid-argument", "Token is required.");

  const snap = await invitationRef(token).get();
  if (!snap.exists) throw new HttpsError("not-found", "This invitation link is not valid.");

  const data = snap.data()!;
  const expired = (data.expiresAt as Timestamp)?.toMillis() < Date.now();

  const preview: InvitePreview = {
    inviterName: data.inviterName ?? "Someone",
    inviteeName: data.inviteeName ?? "",
    inviteeEmail: data.inviteeEmail ?? "",
    status: expired && data.status === "pending" ? "expired" : data.status,
  };
  return preview;
});

/**
 * Links the signed-in account to the inviter. Writes the link on both sides in
 * one batch so a half-formed link can't exist: sharing checks the recipient's
 * own linkedMembers, and a one-sided write would let one party see the other's
 * cards without reciprocity.
 */
export const acceptFamilyInvite = onCall<{ token: string }>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to accept this invitation.");

  const token = request.data?.token;
  if (!token) throw new HttpsError("invalid-argument", "Token is required.");

  const ref = invitationRef(token);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "This invitation link is not valid.");

  const invite = snap.data()!;

  if (invite.status !== "pending") {
    throw new HttpsError("failed-precondition", "This invitation has already been used.");
  }
  if ((invite.expiresAt as Timestamp)?.toMillis() < Date.now()) {
    throw new HttpsError("deadline-exceeded", "This invitation has expired.");
  }
  if (invite.inviterUid === uid) {
    throw new HttpsError("failed-precondition", "You can't accept your own invitation.");
  }

  const inviterUid = invite.inviterUid as string;
  const [inviterSnap, accepterSnap] = await Promise.all([
    db.doc(`users/${inviterUid}`).get(),
    db.doc(`users/${uid}`).get(),
  ]);

  const inviter = inviterSnap.data();
  const accepter = accepterSnap.data();

  const batch = db.batch();

  batch.update(ref, {
    status: "accepted",
    acceptedByUid: uid,
    acceptedAt: FieldValue.serverTimestamp(),
  });

  // Mark the inviter's roster entry as a real linked account.
  batch.update(db.doc(`users/${inviterUid}/familyMembers/${invite.memberId}`), {
    linkStatus: "linked",
    linkedUid: uid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.set(db.doc(`users/${inviterUid}/linkedMembers/${uid}`), {
    displayName: accepter?.fullName ?? invite.inviteeName ?? "Member",
    email: accepter?.email ?? invite.inviteeEmail ?? null,
    linkedAt: FieldValue.serverTimestamp(),
  });

  batch.set(db.doc(`users/${uid}/linkedMembers/${inviterUid}`), {
    displayName: inviter?.fullName ?? invite.inviterName ?? "Member",
    email: inviter?.email ?? null,
    linkedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { linkedWith: inviter?.fullName ?? invite.inviterName ?? "your family" };
});

/**
 * Re-sends an invitation for a member who hasn't accepted yet. The old token
 * is revoked so a forwarded copy of the first email stops working.
 */
export const resendFamilyInvite = onCall<{ memberId: string }>(
  { secrets: EMAIL_SECRETS },
  async (request) => {
  const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Must be signed in.");

    const memberId = request.data?.memberId;
    if (!memberId) throw new HttpsError("invalid-argument", "Member id is required.");

    const memberSnap = await db.doc(`users/${uid}/familyMembers/${memberId}`).get();
    if (!memberSnap.exists) throw new HttpsError("not-found", "Family member not found.");

    const member = memberSnap.data()!;
    if (!member.email) {
      throw new HttpsError("failed-precondition", "This member has no email address on file.");
    }
    if (member.linkStatus === "linked") {
      throw new HttpsError("failed-precondition", "This member is already linked.");
    }

    // Revoke any outstanding token so a forwarded copy of the earlier email
    // can no longer be used to claim the link.
    const stale = await db
      .collection("invitations")
      .where("inviterUid", "==", uid)
      .where("memberId", "==", memberId)
      .where("status", "==", "pending")
      .get();

    const batch = db.batch();
    stale.docs.forEach((doc) => batch.update(doc.ref, { status: "revoked" }));
    await batch.commit();

    const profile = await db.doc(`users/${uid}`).get();

    await createAndSendInvite({
      inviterUid: uid,
      inviterName: (profile.data()?.fullName as string) ?? "A Smart R user",
      memberId,
      inviteeName: member.name as string,
      inviteeEmail: member.email as string,
    });

    await db.doc(`users/${uid}/familyMembers/${memberId}`).update({
      linkStatus: "invited",
      invitedAt: FieldValue.serverTimestamp(),
    });

    return { ok: true };
  }
);
