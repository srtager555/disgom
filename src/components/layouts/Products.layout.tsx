import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { useEffect } from "react";

export function ProductsLayout({ children }: { children: children }) {
  useEffect(() => {
    console.log(Math.floor(Math.random() * 10));
  }, []);
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
          {children}
        </Container>
      </Container>
      ES el martillo, tomame una foto XD
    </>
  );
}
