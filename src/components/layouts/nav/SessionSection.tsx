import { useEffect, useState } from "react";
import { NavElement } from ".";
import { Anchors } from "./Anchors";
import { getAuth } from "firebase/auth";

export function SessionNavSection() {
  const [url, setUrl] = useState<Record<string, NavElement>>({
    session: {
      href: "/session",
      icon: undefined,
      name: "Sesión de usuario",
      children: {
        manage: {
          href: "/session/",
          name: "Administrar Cuentas",
        },
        closeSession: {
          href: "/signout",
          name: "Cerrar Sesión",
        },
      }, // Inicialmente vacío, se llenará desde Firestore
    },
  });

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setUrl((currentUrl) => ({
        ...currentUrl,
        session: {
          ...currentUrl.session,
          name: "Sesión de " + user.displayName,
          children: {
            ...currentUrl.session.children,
          },
        },
      }));
    }
  }, []);

  return Object.values(url).map((el, i) => (
    <Anchors key={i} {...el} child={false} />
  ));
}
