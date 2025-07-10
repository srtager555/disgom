import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { useIdleTimer } from "react-idle-timer";

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutos

export function useInactivityLogout() {
  const router = useRouter();

  useIdleTimer({
    timeout: INACTIVITY_LIMIT,
    onIdle: () => {
      const auth = getAuth();

      if (auth.currentUser) {
        console.log("Usuario inactivo, cerrando sesión.");
        signOut(auth);

        router.push("/");
      }
    },
  });
}
