import { useContext, useEffect, useState } from "react";
import { NavElement } from ".";
import { Anchors } from "./Anchors";
import { LoginContext } from "../login.layout";

export function SessionNavSection() {
  const { currentUserFirestore } = useContext(LoginContext);
  const [url, setUrl] = useState<Record<string, NavElement>>({
    session: {
      href: "/session",
      icon: "user",
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
    if (currentUserFirestore) {
      const data = currentUserFirestore.data();
      setUrl((currentUrl) => ({
        ...currentUrl,
        session: {
          ...currentUrl.session,
          name: "" + data?.username,
          children: {
            ...currentUrl.session.children,
          },
        },
      }));
    }
  }, [currentUserFirestore]);

  return Object.values(url).map((el, i) => (
    <Anchors key={i} {...el} child={false} />
  ));
}
