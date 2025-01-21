import { useGetProducts } from "@/hooks/products/getProducts";
import { Column, Product } from "./Product";
import { Container, FlexContainer } from "@/styles/index.styles";
import styled, { css } from "styled-components";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { InvoiceContext } from "@/pages/invoices/create";
import { globalCSSVars } from "@/styles/colors";
import { Select } from "@/components/Inputs/select";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { Tag, TagsDoc } from "@/tools/products/tags";
import { doc, DocumentReference, onSnapshot } from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import { Button } from "@/styles/Form.styles";

export type priceVariation = {
  total: number;
  variations: Array<{
    amount: number;
    price: number;
  }>;
};

export type productResult = {
  amount: number;
  cost: number;
  sold: priceVariation;
  profit: number;
  seller_sold: priceVariation;
  seller_profit: number;
};

export const ProductContainer = styled.div<{
  $hasInventory: boolean | undefined;
  $withoutStock?: number;
  $header?: boolean;
  $fold?: boolean;
  $children?: boolean;
  $closing?: boolean;
  $warn?: boolean;
  $hide?: boolean;
}>`
  display: ${(props) => (props.$fold ? "none" : "grid")};
  grid-column: 1 / -1;
  gap: 10px;
  overflow: hidden;
  transition: 200ms ease all;
  height: ${(props) =>
    !props.$hide ? (props.$fold ? "35px" : "auto") : "0px"};
  padding: ${(props) => (!props.$hide ? (props.$header ? "10px" : "5px") : 0)} 0;
  visibility: ${(props) => (props.$hide ? "hidden" : "visible")};
  grid-template-columns: repeat(
    ${(props) => {
      if (props.$closing) return "17, 75px";
      if (props.$hasInventory) {
        return "13, 75px";
      } else {
        return "10, 75px";
      }
    }}
  );

  &:nth-child(even) {
    ${(props) => {
      if (props.$children) {
        return css`
          background-color: transparent;
        `;
      }

      return css`
        background-color: ${globalCSSVars["--background-highlight"]};
      `;
    }}
  }

  @media print {
    grid-template-columns: repeat(20, 1fr);
  }

  ${(props) =>
    props.$header &&
    css`
      position: sticky;
      top: 0;
      z-index: 999;
      /* box-shadow: 0 5px 15px #0003; */
    `}

  /* ${(props) =>
    props.$hide &&
    css`
      /* display: none; */
      opacity: 0;
      height: 0px;
    `} */

  ${(props) =>
    props.$warn &&
    css`
      color: red;
      font-weight: bold;
      text-decoration: underline;
    `}

  ${(props) =>
    !props.$children
      ? css`
          padding-left: 10px;
          background-color: ${globalCSSVars["--background"]};
        `
      : css`
          background-color: transparent;
        `}

  ${(props) =>
    !props.$withoutStock &&
    css`
      opacity: 0.5;
      pointer-events: none;
    `}
`;

type props = {
  setProductsResults: Dispatch<SetStateAction<Record<string, productResult>>>;
};

export function ProductList({ setProductsResults }: props) {
  const [tagSelected, setTagSelected] = useState("");
  const products = useGetProducts(tagSelected);
  const [tags, setTags] = useState<Tag>();
  const { selectedSeller } = useContext(InvoiceContext);
  const [hideProductWithoutStock, setHideProductWithoutStock] = useState(false);

  useEffect(() => {
    const db = Firestore();
    const ref = doc(
      db,
      ProductsCollection.root,
      ProductsCollection.tags
    ) as DocumentReference<TagsDoc>;

    const unsubcribe = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (data) setTags(data.tags);
    });

    return function () {
      unsubcribe();
    };
  }, []);

  return (
    <Container styles={{ margin: "50px 0" }}>
      <FlexContainer styles={{ marginBottom: "20px" }}>
        <Container styles={{ marginRight: "20px" }}>
          Filtrar por etiquetas{" "}
          {tags && (
            <Select
              onChange={(e) => {
                setTagSelected(e.target.value);
              }}
              options={[
                { name: "Sin filtro", value: "", selected: true },
                ...Object.values(tags).map((el) => ({
                  name: el.name,
                  value: el.name,
                })),
              ]}
            />
          )}
        </Container>
        <Container styles={{ marginRight: "20px" }}>
          <Button
            onClick={() => setHideProductWithoutStock(!hideProductWithoutStock)}
          >
            {hideProductWithoutStock ? "Mostrar todo" : "Solo con existencias"}
          </Button>
        </Container>
      </FlexContainer>
      <Descriptions hasInventory={selectedSeller?.data().hasInventory} />

      {products.docs?.length === 0 ? (
        <>no hay productos</>
      ) : (
        products.docs?.map((el, i) => (
          <Product
            key={i}
            product={el}
            setProductsResults={setProductsResults}
            hasInventory={selectedSeller?.data().hasInventory}
            hideWithoutStock={hideProductWithoutStock}
          />
        ))
      )}
    </Container>
  );
}

export const Descriptions = ({
  hasInventory,
}: {
  hasInventory: boolean | undefined;
}) => (
  <ProductContainer $header $withoutStock={1} $hasInventory={hasInventory}>
    <Column gridColumn="1 / 4" printGridColumn="1 / 8">
      Nombre del producto
    </Column>
    <Column gridColumn="4 / 5" printGridColumn="8 / 10">
      Cant
    </Column>
    <Column gridColumn="5 / 6">P Costo</Column>
    <Column gridColumn="6 / 7">T Costo</Column>
    <Column gridColumn="7 / 8" printGridColumn="-4 / -6">
      Precio
    </Column>
    <Column gridColumn="8 / 9" printGridColumn="-1 / -4">
      Total
    </Column>
    <Column gridColumn="9 / 10">Ganan</Column>
    {hasInventory && (
      <>
        <Column gridColumn="10 / 11">P Vend</Column>
        <Column gridColumn="11 / 12">V Vend</Column>
        <Column gridColumn="12 / 13">G Vend</Column>
      </>
    )}
    <Column gridColumn="-1 / -2">Extra</Column>
  </ProductContainer>
);
