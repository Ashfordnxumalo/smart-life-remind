import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  createLoyaltyCard,
  deleteLoyaltyCard,
  subscribeToLoyaltyCards,
  updateLoyaltyCard,
} from "@/lib/firestore/loyaltyCards";
import { subscribeToLinkedMembers } from "@/lib/firestore/invitations";
import type { LinkedMember } from "@/types/reminder";
import type {
  LoyaltyCardUpdate,
  NewLoyaltyCard,
  WalletCard,
} from "@/types/loyaltyCard";

/**
 * The signed-in user's cards plus those of every account they've linked with
 * by accepting a family invitation. Each linked account is a separate
 * subscription — Firestore can't query across users — so cards are collected
 * per owner and merged, keeping one live listener per account.
 */
export const useLoyaltyCards = () => {
  const { user } = useAuth();
  const [linked, setLinked] = useState<LinkedMember[]>([]);
  const [cardsByOwner, setCardsByOwner] = useState<Record<string, WalletCard[]>>({});
  const [loadingOwn, setLoadingOwn] = useState(true);

  // Read inside subscription callbacks without making them a dependency, which
  // would tear down and rebuild every listener each time a name changed.
  const linkedRef = useRef<LinkedMember[]>([]);
  linkedRef.current = linked;

  useEffect(() => {
    if (!user) {
      setLinked([]);
      return;
    }
    return subscribeToLinkedMembers(user.uid, setLinked, (error) =>
      console.error("Failed to load linked members:", error)
    );
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCardsByOwner({});
      setLoadingOwn(false);
      return;
    }

    setLoadingOwn(true);

    const owners = [user.uid, ...linked.map((m) => m.uid)];

    const unsubscribes = owners.map((ownerUid) =>
      subscribeToLoyaltyCards(
        ownerUid,
        (data) => {
          const isOwn = ownerUid === user.uid;
          const sharedBy = isOwn
            ? null
            : (linkedRef.current.find((m) => m.uid === ownerUid)?.displayName ?? "A linked member");

          setCardsByOwner((prev) => ({
            ...prev,
            [ownerUid]: data.map((card) => ({ ...card, ownerUid, sharedBy })),
          }));
          if (isOwn) setLoadingOwn(false);
        },
        (error) => {
          // A linked member's cards failing shouldn't blank the whole wallet.
          console.error(`Failed to load cards for ${ownerUid}:`, error);
          setCardsByOwner((prev) => ({ ...prev, [ownerUid]: [] }));
          if (ownerUid === user.uid) setLoadingOwn(false);
        }
      )
    );

    return () => {
      unsubscribes.forEach((fn) => fn());
      // Drop owners that are no longer subscribed, so an unlinked member's
      // cards don't linger in the merged list.
      setCardsByOwner((prev) => {
        const next: Record<string, WalletCard[]> = {};
        owners.forEach((uid) => {
          if (prev[uid]) next[uid] = prev[uid];
        });
        return next;
      });
    };
  }, [user, linked]);

  const cards = useMemo(() => {
    const merged = Object.values(cardsByOwner).flat();
    // Own cards first, then shared, each alphabetical — so the wallet doesn't
    // reshuffle as other people's cards arrive.
    return merged.sort((a, b) => {
      if (!a.sharedBy !== !b.sharedBy) return a.sharedBy ? 1 : -1;
      return a.retailer.localeCompare(b.retailer);
    });
  }, [cardsByOwner]);

  const create = useCallback(
    async (data: NewLoyaltyCard) => {
      if (!user) throw new Error("Must be signed in to add a card.");
      return createLoyaltyCard(user.uid, data);
    },
    [user]
  );

  const update = useCallback(
    async (id: string, data: LoyaltyCardUpdate) => {
      if (!user) throw new Error("Must be signed in.");
      await updateLoyaltyCard(user.uid, id, data);
    },
    [user]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Must be signed in.");
      await deleteLoyaltyCard(user.uid, id);
    },
    [user]
  );

  return { cards, loading: loadingOwn, linkedMembers: linked, create, update, remove };
};
