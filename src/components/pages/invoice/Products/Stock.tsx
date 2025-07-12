import { useGetProduct } from "@/hooks/products/getProduct";
import { globalCSSVars } from "@/styles/colors";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { stockType } from "@/tools/products/addToStock";
import { Dispatch, SetStateAction } from "react";
import styled, { css } from "styled-components";

const StockMapContainer = styled(Container)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 1fr;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  width: 100%;
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

  if (product.data?.product_parent) return <></>;

  return (
    <>
      <h3>Existencias</h3>

      <p>Para editar una entrada seleccionela</p>

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
                    {_.created_at.toDate().toLocaleDateString()} - hay{" "}
                    {_.amount.toFixed(2)} {product.data?.units}
                    <FlexContainer
                      styles={{ justifyContent: "space-between", gap: "20px" }}
                    >
                      <Container styles={{ whiteSpace: "nowrap" }}>
                        Costo {_.purchase_price}
                      </Container>
                      <Container styles={{ whiteSpace: "nowrap" }}>
                        Precio {_.sale_price}
                      </Container>
                      <Container styles={{ whiteSpace: "nowrap" }}>
                        Vendedor {_.seller_commission}
                      </Container>
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
