import { useInactivityLogout } from "@/hooks/login/useInactivityLogout";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/router";
import { createContext, useEffect, useState } from "react";

interface props {
  children: children;
}

export type userType =
  | "Administrador"
  | "Operaciones"
  | "Contador"
  | "Usuario"
  | "dev";

export const LoginContext = createContext<{
  currentUser: User | undefined;
}>({
  currentUser: undefined,
});

export function LoginLayout({ children }: props) {
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const router = useRouter();

  // logout the user after 5 minutes
  useInactivityLogout();

  // effect to get the current user
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(undefined);
        router.push("/");
      }
    });

    return unsub;

    // critial error: infinte loop if router is in the deps
    // // *NOT ADD ROUTER TO THE DEPS*
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LoginContext.Provider value={{ currentUser }}>
      {children}
    </LoginContext.Provider>
  );
}
