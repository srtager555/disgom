import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { AnchorNavigators } from "@/styles/Nav.module";
import { Products } from "../pages/products";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { useRouter } from "next/router";

export const ProductContext = createContext<{
  selectedProduct: QueryDocumentSnapshot<productDoc> | undefined;
  setSelectedProduct:
    | Dispatch<SetStateAction<QueryDocumentSnapshot<productDoc> | undefined>>
    | undefined;
}>({
  selectedProduct: undefined,
  setSelectedProduct: undefined,
});

export function ProductsLayout({ children }: { children: children }) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] =
    useState<QueryDocumentSnapshot<productDoc>>();
  const url: Array<{ href: string; text: string }> = [
    {
      href: "",
      text: "Descripción general",
    },
    {
      href: "/create",
      text: "Añadir o editar producto",
    },
  ];

  useEffect(() => {
    setSelectedProduct(undefined);
  }, [router.asPath]);

  return (
    <ProductContext.Provider
      value={{
        selectedProduct,
        setSelectedProduct,
      }}
    >
      <Container styles={{ marginBottom: "25px" }}>
        <Container
          styles={{
            display: "inline-block",
            border: "2px solid " + globalCSSVars["--foreground"],
            borderRadius: "20px",
            padding: "10px",
            width: "100%",
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
    </ProductContext.Provider>
  );
}
