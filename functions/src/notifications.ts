import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin.js";

/**
 * Replaces the missing send-reminder-notification edge function from the old
 * Supabase app. Fires whenever a reminder is created or its assignedMemberId
 * changes, and writes the in-app notification log doc. Real email/WhatsApp
 * delivery needs third-party provider keys (SendGrid/Twilio) the user
 * doesn't have yet, so this is intentionally log-only for now.
 */
export const onReminderAssigned = onDocumentWritten(
  "users/{uid}/reminders/{reminderId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return; // deleted

    const assignedMemberId = after.assignedMemberId as string | null | undefined;
    if (!assignedMemberId) return;

    const wasAlreadyAssignedToSameMember = before?.assignedMemberId === assignedMemberId;
    if (wasAlreadyAssignedToSameMember) return;

    const { uid, reminderId } = event.params;

    const memberSnap = await db.doc(`users/${uid}/familyMembers/${assignedMemberId}`).get();
    if (!memberSnap.exists) return;
    const member = memberSnap.data();

    await db.collection(`users/${uid}/notifications`).add({
      recipientMemberId: assignedMemberId,
      reminderId,
      message: `You've been assigned "${after.title}", due ${after.dueDate}.`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Delivery hooks (email/WhatsApp) go here once the user configures a
    // transactional provider — e.g. SendGrid for member.email, Twilio for
    // member.phone. Left as a no-op so assignment never throws in the
    // meantime, unlike the old broken edge-function call.
    void member;
  }
);
