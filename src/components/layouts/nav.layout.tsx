import { Nav, NavAnchor, NavContainer } from "@/styles/Nav.module";
import { Icon, iconType } from "../Icons";
import { Container } from "@/styles/index.styles";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export function NavLayout({ children }: { children: children }) {
  const [url, setUrl] = useState<
    Array<{ href: string; icon: iconType; active: boolean }>
  >([
    {
      href: "/feed",
      icon: "home",
      active: false,
    },
    {
      href: "/sellers",
      icon: "seller",
      active: false,
    },
    {
      href: "/products",
      icon: "product",
      active: false,
    },
    {
      href: "/invoices",
      icon: "invoice",
      active: false,
    },
    {
      href: "/invoices",
      icon: "chart",
      active: false,
    },
  ]);
  const { asPath } = useRouter();

  useEffect(() => {
    const anchors = [...url];

    anchors.forEach((a) => {
      if (asPath.match(a.href)) {
        a.active = true;
      } else a.active = false;
    });

    setUrl(anchors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asPath]);

  return (
    <NavContainer $deployNav={false}>
      <Container>
        <Nav>
          {url.map((el, i) => (
            <NavAnchor key={i} href={el.href} $active={el.active}>
              <Icon iconType={el.icon} />
            </NavAnchor>
          ))}
        </Nav>
      </Container>
      {children}
    </NavContainer>
  );
}
