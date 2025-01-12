import { useGetProducts } from "@/hooks/products/getProducts";
import { Product } from "./Product";
import { Container } from "@/styles/index.styles";
import styled, { css } from "styled-components";
import { Dispatch, SetStateAction, useContext } from "react";
import { InvoiceContext } from "@/pages/invoices/create";
import { globalCSSVars } from "@/styles/colors";

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
}>`
  ${(props) =>
    props.$header &&
    css`
      position: sticky;
      top: 0;
      z-index: 999;
      /* box-shadow: 0 5px 15px #0003; */
    `}
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(
    ${(props) => (props.$hasInventory ? "13, 60px" : "10, 75px")}
  );
  ${(props) =>
    !props.$children
      ? css`
          padding: ${props.$header ? "10px" : "5px"} 0;
          padding-left: 10px;
          background-color: ${globalCSSVars["--background"]};
        `
      : css`
          background-color: inherit;
        `}
  gap: 10px;
  overflow: hidden;
  ${(props) => {
    if (typeof props.$fold === "boolean") {
      return css`
        display: ${props.$fold ? "none" : "grid"};
      `;
    }
  }};

  &:nth-child(even) {
    background-color: ${globalCSSVars["--background-highlight"]};
  }

  ${(props) =>
    !props.$withoutStock &&
    css`
      opacity: 0.5;
      pointer-events: none;
    `}
`;

const Column = styled(Container)<{ $gridColumn: string }>`
  grid-column: ${(props) => props.$gridColumn};
  justify-items: center;
  border-right: solid 1px #000;
`;

type props = {
  setProductsResults: Dispatch<SetStateAction<Record<string, productResult>>>;
};

export function ProductList({ setProductsResults }: props) {
  const products = useGetProducts();
  const { selectedSeller } = useContext(InvoiceContext);

  return (
    <Container styles={{ margin: "50px 0" }}>
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
    <Column $gridColumn="1 / 4">Nombre del producto</Column>
    <Column $gridColumn="4 / 5">Cant</Column>
    <Column $gridColumn="5 / 6">P Costo</Column>
    <Column $gridColumn="6 / 7">T Costo</Column>
    <Column $gridColumn="7 / 8">P Venta</Column>
    <Column $gridColumn="8 / 9">T Venta</Column>
    <Column $gridColumn="9 / 10">Ganan</Column>
    {hasInventory && (
      <>
        <Column $gridColumn="10 / 11">P Vend</Column>
        <Column $gridColumn="11 / 12">V Vend</Column>
        <Column $gridColumn="12 / 13">G Vend</Column>
      </>
    )}
    <Column $gridColumn="-1 / -2">Extra</Column>
  </ProductContainer>
);
