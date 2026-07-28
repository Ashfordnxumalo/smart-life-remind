import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";

const ensureProfileCallable = httpsCallable(functions, "ensureProfile");

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        // Defensive self-heal — the profile doc is normally created client-side
        // right after sign-up. This backstops any interrupted write.
        ensureProfileCallable().catch((error) => {
          console.error("ensureProfile failed:", error);
        });
      }
    });

    return unsubscribe;
  }, []);

  return { user, loading };
};
