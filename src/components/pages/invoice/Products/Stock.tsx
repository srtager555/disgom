import { useGetProduct } from "@/hooks/products/getProduct";
import { globalCSSVars } from "@/styles/colors";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { stockType } from "@/tools/products/addToStock";
import { Dispatch, SetStateAction } from "react";
import styled, { css } from "styled-components";

const StockMapContainer = styled(Container)`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, 1fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  /* padding: 10px;
  border: solid 2px ${globalCSSVars["--foreground"]}; */
  border-radius: 5px;
  margin-bottom: 20px;
`;

const StockButton = styled(Button)<{ $selected: boolean }>`
  text-align: start;
  padding: 5px;
  width: 100%;
  background-color: ${(props) =>
    props.$selected
      ? globalCSSVars["--selected"]
      : globalCSSVars["--background"]};
  ${(props) =>
    props.$selected &&
    css`
      color: #fff;
      transform: scale(1.04);
    `}

  &:hover {
    transform: scale(1.02);
  }
  &:active {
    transform: scale(0.95);
  }
`;

type props = {
  stock: stockType[];
  entryToEdit: stockType | undefined;
  setEntryToEdit: Dispatch<SetStateAction<stockType | undefined>>;
};

export function ProductStock({ stock, entryToEdit, setEntryToEdit }: props) {
  const product = useGetProduct();

  // function to select and unselect a entry
  function handlerSelectEntry(stock: stockType) {
    if (entryToEdit === stock) setEntryToEdit(undefined);
    else setEntryToEdit(stock);
  }

  return (
    <>
      <h3>{product.data?.product_parent ? <>Precio</> : <>Existencias</>}</h3>
      {stock.length > 0 && product.data?.product_parent ? (
        <p>El precio actual que tiene el producto</p>
      ) : (
        <p>Para editar una entrada seleccionela</p>
      )}
      <StockMapContainer>
        {stock.length === 0 ? (
          <p>No hay existencia de este producto</p>
        ) : (
          <>
            {stock.map((_, i) => {
              return (
                <Container key={i} styles={{ width: "100%" }}>
                  <StockButton
                    $selected={_ === entryToEdit}
                    onClick={() => handlerSelectEntry(_)}
                  >
                    {!product.data?.product_parent && (
                      <>
                        {_.created_at.toDate().toLocaleDateString()} - hay{" "}
                        {_.amount} {product.data?.units}
                      </>
                    )}
                    <FlexContainer>
                      <Container styles={{ marginRight: "10px" }}>
                        Costo {_.purchase_price} -
                      </Container>
                      <Container styles={{ marginRight: "10px" }}>
                        Precio {_.sale_price} -
                      </Container>
                      <Container>Vendedor {_.seller_commission}</Container>
                    </FlexContainer>
                  </StockButton>
                </Container>
              );
            })}
          </>
        )}
      </StockMapContainer>
    </>
  );
}
