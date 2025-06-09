import { getAuth } from "firebase/auth";
import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    const auth = getAuth();
    auth.signOut();
  }, []);

  return "Cerrando Sesión";
}
