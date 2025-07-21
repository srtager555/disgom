import { getAuth } from "firebase/auth";
import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    const auth = getAuth();
    auth.signOut();
  }, []);

  return "Cerrando Sesión";
}

export async function getStaticProps() {
  // No necesitas pasar props, solo asegurar que la página se genere estáticamente.
  return {
    props: {},
  };
}
