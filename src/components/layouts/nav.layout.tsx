import { Nav, NavAnchor, NavContainer } from "@/styles/Nav.module";
import { Icon } from "../Icons";

export function NavLayout({ children }: { children: children }) {
  return (
    <NavContainer deployNav={false}>
      <Nav>
        <NavAnchor href={"/feed"}>
          <Icon iconType="home" />
        </NavAnchor>
        <NavAnchor href={"/sellers"}>
          <Icon iconType="seller" />
        </NavAnchor>
        <NavAnchor href={"/products"}>
          <Icon iconType="product" />
        </NavAnchor>
        <NavAnchor href={"/invoices"}>
          <Icon iconType="invoice" />
        </NavAnchor>
        <NavAnchor href={"/invoices"}>
          <Icon iconType="chart" />
        </NavAnchor>
      </Nav>
      {children}
    </NavContainer>
  );
}
