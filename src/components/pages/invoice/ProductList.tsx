import { useGetProducts } from "@/hooks/products/getProducts";
import { Product } from "./Product";
import { Container } from "@/styles/index.styles";
import styled, { css } from "styled-components";
import { useContext } from "react";
import { InvoiceContext } from "@/pages/invoices/create";
import { globalCSSVars } from "@/styles/colors";

export const ProductContainer = styled.div<{
  $hasInventory: boolean | undefined;
  $withoutStock?: number;
  $header?: boolean;
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
  grid-template-columns: repeat(
    ${(props) => (props.$hasInventory ? "13, 60px" : "10, 75px")}
  );
  padding: ${(props) => (props.$header ? "10px" : "5px")} 0;
  padding-left: 10px;
  /* margin-bottom: 10px; */
  gap: 10px;
  background-color: ${globalCSSVars["--background"]};

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

export function ProductList() {
  const products = useGetProducts();
  const { selectedSeller } = useContext(InvoiceContext);

  return (
    <Container styles={{ margin: "50px 0" }}>
      <ProductContainer
        $header
        $withoutStock={1}
        $hasInventory={selectedSeller?.data().hasInventory}
      >
        <Descriptions hasInventory={selectedSeller?.data().hasInventory} />
      </ProductContainer>
      {products.docs?.length === 0 ? (
        <>no hay productos</>
      ) : (
        products.docs?.map((el, i) => (
          <Product
            key={i}
            product={el}
            hasInventory={selectedSeller?.data().hasInventory}
          />
        ))
      )}
    </Container>
  );
}

const Descriptions = ({
  hasInventory,
}: {
  hasInventory: boolean | undefined;
}) => (
  <>
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
  </>
);
