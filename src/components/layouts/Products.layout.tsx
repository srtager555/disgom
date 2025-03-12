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
import styled from "styled-components";

export const ProductContext = createContext<{
  selectedProduct: QueryDocumentSnapshot<productDoc> | undefined;
  setSelectedProduct:
    | Dispatch<SetStateAction<QueryDocumentSnapshot<productDoc> | undefined>>
    | undefined;
  setShowProductsList:
    | Dispatch<SetStateAction<boolean | undefined>>
    | undefined;
  setHideBorder: Dispatch<SetStateAction<boolean | undefined>> | undefined;
}>({
  selectedProduct: undefined,
  setSelectedProduct: undefined,
  setShowProductsList: undefined,
  setHideBorder: undefined,
});

const MainContainer = styled(Container)<{ hideBorder: boolean | undefined }>`
  display: inline-block;
  border: ${(props) => (!props.hideBorder ? "2px" : "0px")} solid
    ${globalCSSVars["--foreground"]};
  border-radius: 20px;
  padding: 10px;
  width: 100%;

  @media print {
    display: none;
  }
`;

export function ProductsLayout({ children }: { children: children }) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] =
    useState<QueryDocumentSnapshot<productDoc>>();
  const [showProductsList, setShowProductsList] = useState<boolean | undefined>(
    true
  );
  const [hideBorder, setHideBorder] = useState<boolean | undefined>(false);
  const url: Array<{ href: string; text: string }> = [
    {
      href: "",
      text: "Descripción general",
    },
    {
      href: "/detailed",
      text: "Descripción detallada",
    },
    {
      href: "/inventory",
      text: "Inventarios",
    },
    {
      href: "/create",
      text: "Añadir o editar producto",
    },
    {
      href: "/list",
      text: "Lista de productos",
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
        setShowProductsList,
        setHideBorder,
      }}
    >
      <Container styles={{ marginBottom: "25px" }}>
        <MainContainer hideBorder={hideBorder}>
          <Container styles={{ marginBottom: "30px" }}>
            {url.map((el, i) => (
              <AnchorNavigators key={i} href={"/products" + el.href}>
                {el.text}
              </AnchorNavigators>
            ))}
          </Container>
          {children}
        </MainContainer>
      </Container>
      {showProductsList && <Products />}
    </ProductContext.Provider>
  );
}
