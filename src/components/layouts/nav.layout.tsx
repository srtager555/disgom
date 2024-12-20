import { Nav, NavAnchor, NavContainer } from "@/styles/Nav.module";

export function NavLayout({ children }: { children: children }) {
  return (
    <NavContainer deployNav={false}>
      <Nav>
        <NavAnchor href={""}>Awa</NavAnchor>
      </Nav>
      {children}
    </NavContainer>
  );
}
