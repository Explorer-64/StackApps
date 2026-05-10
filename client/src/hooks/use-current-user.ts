import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { initializeFirebase, getFirebaseAuth } from "@/lib/firebase";

export const useCurrentUser = (): {
  user: User | null;
  loading: boolean;
} => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setup = async () => {
      try {
        await initializeFirebase();
        const auth = getFirebaseAuth();
        unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
          setUser(currentUser);
          setLoading(false);
        });
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        setLoading(false);
      }
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { user, loading };
};
