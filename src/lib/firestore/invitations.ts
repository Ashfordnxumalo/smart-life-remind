import { httpsCallable } from "firebase/functions";
import { collection, onSnapshot } from "firebase/firestore";
import { db, functions } from "@/lib/firebase";
import type { LinkedMember } from "@/types/reminder";
import { toISO } from "./utils";

export interface InvitePreview {
  inviterName: string;
  inviteeName: string;
  inviteeEmail: string;
  status: "pending" | "accepted" | "revoked" | "expired";
}

const previewCallable = httpsCallable<{ token: string }, InvitePreview>(
  functions,
  "getInvitePreview"
);

const acceptCallable = httpsCallable<{ token: string }, { linkedWith: string }>(
  functions,
  "acceptFamilyInvite"
);

/** Readable without signing in — holding the token is the credential. */
export const getInvitePreview = async (token: string) => {
  const result = await previewCallable({ token });
  return result.data;
};

export const acceptFamilyInvite = async (token: string) => {
  const result = await acceptCallable({ token });
  return result.data;
};

/**
 * Where the invite token is parked while the recipient signs in or registers.
 * sessionStorage rather than local: it should not outlive the tab, and a stale
 * token surfacing weeks later would be confusing rather than helpful.
 */
const PENDING_INVITE_KEY = "smartremind.pendingInvite";

export const rememberPendingInvite = (token: string) => {
  try {
    sessionStorage.setItem(PENDING_INVITE_KEY, token);
  } catch {
    // Private browsing can refuse storage; the user can still use the link.
  }
};

export const takePendingInvite = (): string | null => {
  try {
    const token = sessionStorage.getItem(PENDING_INVITE_KEY);
    if (token) sessionStorage.removeItem(PENDING_INVITE_KEY);
    return token;
  } catch {
    return null;
  }
};

export const subscribeToLinkedMembers = (
  uid: string,
  onData: (members: LinkedMember[]) => void,
  onError?: (error: Error) => void
) =>
  onSnapshot(
    collection(db, "users", uid, "linkedMembers"),
    (snap) =>
      onData(
        snap.docs.map((d) => ({
          uid: d.id,
          displayName: (d.data().displayName as string) ?? "Member",
          email: (d.data().email as string | null) ?? null,
          linkedAt: toISO(d.data().linkedAt) ?? "",
        }))
      ),
    (error) => onError?.(error)
  );
