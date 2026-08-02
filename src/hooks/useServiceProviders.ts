import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  createServiceProvider,
  deleteServiceProvider,
  subscribeToServiceProviders,
  updateServiceProvider,
} from "@/lib/firestore/serviceProviders";
import { subscribeToLinkedMembers } from "@/lib/firestore/invitations";
import type { LinkedMember } from "@/types/reminder";
import type {
  NewServiceProvider,
  ServiceProvider,
  ServiceProviderUpdate,
} from "@/types/serviceProvider";

/** A provider plus who it belongs to, since the directory spans the family. */
export interface DirectoryEntry extends ServiceProvider {
  ownerUid: string;
  /** Name of the linked member who added it, or null when it's your own. */
  sharedBy: string | null;
}

/**
 * The family's service providers: this user's, plus those of everyone they're
 * linked with. A geyser is serviced once and everyone needs the number, so
 * sharing is the default rather than something to opt into per record.
 */
export const useServiceProviders = () => {
  const { user } = useAuth();
  const [linked, setLinked] = useState<LinkedMember[]>([]);
  const [byOwner, setByOwner] = useState<Record<string, DirectoryEntry[]>>({});
  const [loadingOwn, setLoadingOwn] = useState(true);

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
      setByOwner({});
      setLoadingOwn(false);
      return;
    }

    setLoadingOwn(true);
    const owners = [user.uid, ...linked.map((m) => m.uid)];

    const unsubscribes = owners.map((ownerUid) =>
      subscribeToServiceProviders(
        ownerUid,
        (data) => {
          const isOwn = ownerUid === user.uid;
          const sharedBy = isOwn
            ? null
            : (linked.find((m) => m.uid === ownerUid)?.displayName ?? "A linked member");

          setByOwner((prev) => ({
            ...prev,
            [ownerUid]: data.map((p) => ({ ...p, ownerUid, sharedBy })),
          }));
          if (isOwn) setLoadingOwn(false);
        },
        (error) => {
          console.error(`Failed to load providers for ${ownerUid}:`, error);
          setByOwner((prev) => ({ ...prev, [ownerUid]: [] }));
          if (ownerUid === user.uid) setLoadingOwn(false);
        }
      )
    );

    return () => {
      unsubscribes.forEach((fn) => fn());
      setByOwner((prev) => {
        const next: Record<string, DirectoryEntry[]> = {};
        owners.forEach((uid) => {
          if (prev[uid]) next[uid] = prev[uid];
        });
        return next;
      });
    };
  }, [user, linked]);

  const providers = useMemo(
    () =>
      Object.values(byOwner)
        .flat()
        .sort(
          (a, b) =>
            a.category.localeCompare(b.category) || a.service.localeCompare(b.service)
        ),
    [byOwner]
  );

  const create = useCallback(
    async (data: NewServiceProvider) => {
      if (!user) throw new Error("Must be signed in.");
      return createServiceProvider(user.uid, data);
    },
    [user]
  );

  const update = useCallback(
    async (id: string, data: ServiceProviderUpdate) => {
      if (!user) throw new Error("Must be signed in.");
      await updateServiceProvider(user.uid, id, data);
    },
    [user]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Must be signed in.");
      await deleteServiceProvider(user.uid, id);
    },
    [user]
  );

  return { providers, loading: loadingOwn, create, update, remove };
};
