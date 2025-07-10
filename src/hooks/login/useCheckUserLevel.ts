import { getUserLevelFromFirestore } from "@/tools/session/getUserLevelFromFirestore";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";

export type userLevelsType = "total" | "none";

export const userLevels: Record<string, userLevelsType> = {
  Ninguno: "none",
  Total: "total",
};

export function useCheckUserLevel() {
  const [currentLevel, setCurrentLevel] = useState<userLevelsType>("none");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userLevel = await getUserLevelFromFirestore(user.uid);

        setCurrentLevel(userLevel);
        setCurrentUser(user);
      } else {
        setCurrentLevel(userLevels.none);
        setCurrentUser(null);
      }
    });
  }, []);

  return { currentLevel, currentUser };
}
