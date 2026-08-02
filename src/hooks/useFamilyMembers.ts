import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToFamilyMembers } from "@/lib/firestore/familyMembers";
import type { FamilyMember } from "@/types/reminder";

/**
 * Live roster of active family members. Extracted from FamilyMembersDialog
 * once the dashboard needed the same list to name whoever a task was
 * assigned to.
 */
export const useFamilyMembers = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFamilyMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    return subscribeToFamilyMembers(user.uid, (members) => {
      setFamilyMembers(members);
      setLoading(false);
    });
  }, [user]);

  return { familyMembers, loading };
};
