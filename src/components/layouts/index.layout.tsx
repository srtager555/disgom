import { InitApp } from "@/firebase/InitApp";
import { NavLayout } from "./nav.layout";
import { Container } from "@/styles/index.styles";
import { LoginLayout } from "./login.layout";

export function Layout({ children }: { children: children }) {
  return (
    <InitApp>
      <LoginLayout>
        <NavLayout>
          <Container styles={{ padding: "0 2.5%", margin: "0 auto" }}>
            {children}
          </Container>
        </NavLayout>
      </LoginLayout>
    </InitApp>
  );
}
