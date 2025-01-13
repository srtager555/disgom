import { InitApp } from "@/firebase/InitApp";
import { NavLayout } from "./nav.layout";
import { Container } from "@/styles/index.styles";
import { createContext, useEffect, useState } from "react";

export const PrintContext = createContext(false);

export function Layout({ children }: { children: children }) {
  const [print, setPrint] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeprint", () => {
      setPrint(true);
    });
    window.addEventListener("afterprint", () => {
      setPrint(false);
    });

    return () => {
      window.removeEventListener("beforeprint", () => {
        setPrint(true);
      });
      window.removeEventListener("afterprint", () => {
        setPrint(false);
      });
    };
  }, []);

  return (
    <PrintContext.Provider value={print}>
      <InitApp>
        <NavLayout>
          <Container styles={{ padding: "0 2.5%", margin: "0 auto" }}>
            {children}
          </Container>
        </NavLayout>
      </InitApp>
    </PrintContext.Provider>
  );
}
