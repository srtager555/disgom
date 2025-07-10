import {
  useCheckUserLevel,
  userLevelsType,
} from "@/hooks/login/useCheckUserLevel";
import { useInactivityLogout } from "@/hooks/login/useInactivityLogout";
import { userDoc } from "@/tools/session/createUserDoc";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { DocumentSnapshot } from "firebase/firestore";
import { useRouter } from "next/router";
import { createContext, useEffect } from "react";

interface props {
  children: children;
}

export const LoginContext = createContext<{
  currentUser: User | null;
  currentLevel: userLevelsType;
  currentUserFirestore: DocumentSnapshot<userDoc> | undefined;
}>({
  currentUser: null,
  currentLevel: "none",
  currentUserFirestore: undefined,
});

export function LoginLayout({ children }: props) {
  const router = useRouter();
  const { currentUser, currentLevel, currentUserFirestore } =
    useCheckUserLevel();

  // logout the user after 5 minutes
  useInactivityLogout();

  // effect to get the current user
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (user) => {
      console.warn(user);
      if (!user) {
        router.push("/");
      }
    });

    return unsub;
    // critial error: infinte loop if router is in the deps
    // // *NOT ADD ROUTER TO THE DEPS*
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LoginContext.Provider
      value={{ currentUser, currentLevel, currentUserFirestore }}
    >
      {children}
    </LoginContext.Provider>
  );
}
