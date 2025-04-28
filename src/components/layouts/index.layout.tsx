import { InitApp } from "@/firebase/InitApp";
import { NavLayout } from "./nav.layout";
import { Container } from "@/styles/index.styles";

export function Layout({ children }: { children: children }) {
  return (
    <InitApp>
      <NavLayout>
        <Container styles={{ padding: "0 2.5%", margin: "0 auto" }}>
          {children}
        </Container>
      </NavLayout>
    </InitApp>
  );
}
