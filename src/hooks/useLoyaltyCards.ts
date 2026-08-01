import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  createLoyaltyCard,
  deleteLoyaltyCard,
  subscribeToLoyaltyCards,
  updateLoyaltyCard,
} from "@/lib/firestore/loyaltyCards";
import type {
  LoyaltyCard,
  LoyaltyCardUpdate,
  NewLoyaltyCard,
} from "@/types/loyaltyCard";

export const useLoyaltyCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToLoyaltyCards(
      user.uid,
      (data) => {
        setCards(data);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load loyalty cards:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

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

  return { cards, loading, create, update, remove };
};
