import { useCallback, useEffect, useRef } from "react";
import { getAuth, signOut } from "firebase/auth";

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutos

export function useInactivityLogout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    const auth = getAuth();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (auth.currentUser) {
        console.log("Usuario inactivo, cerrando sesión.");
        signOut(auth);
      }
    }, INACTIVITY_LIMIT);
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);
}
