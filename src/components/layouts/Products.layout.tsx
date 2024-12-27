import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { AnchorNavigators } from "@/styles/Nav.module";
import { Products } from "../pages/products";

export function ProductsLayout({ children }: { children: children }) {
  const url: Array<{ href: string; text: string }> = [
    {
      href: "",
      text: "Descripción general",
    },
    {
      href: "/create",
      text: "Añadir producto",
    },
    {
      href: "/edit",
      text: "Editar producto",
    },
  ];

  return (
    <>
      <Container styles={{ marginBottom: "25px" }}>
        <Container
          styles={{
            display: "inline-block",
            border: "2px solid " + globalCSSVars["--foreground"],
            borderRadius: "20px",
            padding: "10px",
          }}
        >
          <Container styles={{ marginBottom: "30px" }}>
            {url.map((el, i) => (
              <AnchorNavigators key={i} href={"/products" + el.href}>
                {el.text}
              </AnchorNavigators>
            ))}
          </Container>
          {children}
        </Container>
      </Container>
      <Products />
    </>
  );
}
