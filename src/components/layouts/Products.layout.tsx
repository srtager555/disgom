import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
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
  border: ${(props) => (!props.hideBorder ? "1px" : "0px")} solid
    ${globalCSSVars["--foreground"]};
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
        <MainContainer hideBorder={hideBorder}>{children}</MainContainer>
      </Container>
      {showProductsList && <Products />}
    </ProductContext.Provider>
  );
}
