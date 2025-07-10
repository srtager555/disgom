import { userDoc } from "@/tools/session/createUserDoc";
import { getUserFromFirestore } from "@/tools/session/getUserFromFirestore";
import { getUserLevelFromFirestore } from "@/tools/session/getUserLevelFromFirestore";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { DocumentSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export type userLevelsType = "total" | "none";

export const userLevels: Record<string, userLevelsType> = {
  Ninguno: "none",
  Total: "total",
};

export function useCheckUserLevel() {
  const [currentLevel, setCurrentLevel] = useState<userLevelsType>("none");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserFirestore, setCurrentUserFirestore] =
    useState<DocumentSnapshot<userDoc>>();

  useEffect(() => {
    const auth = getAuth();

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userLevel = await getUserLevelFromFirestore(user.uid);

        const userFromFirestore = await getUserFromFirestore(user.uid);

        setCurrentUserFirestore(userFromFirestore);
        setCurrentLevel(userLevel);
        setCurrentUser(user);
      } else {
        setCurrentLevel(userLevels.none);
        setCurrentUser(null);
      }
    });
  }, []);

  return { currentLevel, currentUser, currentUserFirestore };
}
