import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin.js";
import { EMAIL_SECRETS, sendReminderEmail } from "./email.js";

/**
 * Fires when a reminder is created or reassigned. Writes the in-app
 * notification doc, and — when the reminder opted into email — sends the
 * owner and any assigned member a copy with an add-to-calendar link.
 *
 * Email is best-effort: a delivery failure is logged and swallowed, because
 * the reminder itself is already saved and losing the trigger would leave the
 * in-app notification unwritten too.
 */
export const onReminderAssigned = onDocumentWritten(
  { document: "users/{uid}/reminders/{reminderId}", secrets: EMAIL_SECRETS },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return; // deleted

    const { uid, reminderId } = event.params;

    const isNew = !before;
    const assignedMemberId = (after.assignedMemberId as string | null) ?? null;
    const assignmentChanged = (before?.assignedMemberId ?? null) !== assignedMemberId;

    // Edits that touch neither creation nor assignment shouldn't re-notify.
    if (!isNew && !assignmentChanged) return;

    const prefs = (after.notificationPreferences as string[] | undefined) ?? ["app"];
    const wantsEmail = prefs.includes("email");

    let member: FirebaseFirestore.DocumentData | undefined;
    if (assignedMemberId) {
      const memberSnap = await db.doc(`users/${uid}/familyMembers/${assignedMemberId}`).get();
      member = memberSnap.exists ? memberSnap.data() : undefined;

      if (member && assignmentChanged) {
        await db.collection(`users/${uid}/notifications`).add({
          recipientMemberId: assignedMemberId,
          reminderId,
          message: `You've been assigned "${after.title}", due ${after.dueDate}.`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    if (!wantsEmail) return;

    const ownerSnap = await db.doc(`users/${uid}`).get();
    const owner = ownerSnap.data();
    const ownerName = (owner?.fullName as string | null) || "Someone";

    const base = {
      reminderId,
      title: (after.title as string) ?? "Reminder",
      description: (after.description as string) ?? "",
      dueDate: (after.dueDate as string) ?? "",
      dueTime: (after.dueTime as string | null) ?? null,
      priority: (after.priority as string) ?? "medium",
      category: (after.category as string) ?? "personal",
      location: (after.reminderLocation as string | null) ?? null,
    };

    // A reminder with no due date can't produce a usable calendar entry.
    if (!base.dueDate) return;

    const recipients: Array<Promise<boolean>> = [];

    // The owner always gets a copy — they're the one who set it.
    if (owner?.email) {
      recipients.push(
        sendReminderEmail({
          ...base,
          to: owner.email as string,
          recipientName: ownerName,
          assignedBy: null,
        })
      );
    }

    // The assigned member gets one too, if an address is on file. Skipped when
    // it's the owner's own address, so they don't receive the same thing twice.
    const memberEmail = (member?.email as string | null) ?? null;
    if (memberEmail && memberEmail.toLowerCase() !== String(owner?.email ?? "").toLowerCase()) {
      recipients.push(
        sendReminderEmail({
          ...base,
          to: memberEmail,
          recipientName: (member?.name as string | null) ?? null,
          assignedBy: ownerName,
        })
      );
    }

    await Promise.all(recipients);
  }
);
