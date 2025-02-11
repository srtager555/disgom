import SalesComparisonChart from "@/components/chart";
import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { FormToAddStock } from "@/components/pages/invoice/Products/FormToAddStock";
import { useGetProduct } from "@/hooks/products/getProduct";
import { NextPageWithLayout } from "@/pages/_app";
import { globalCSSVars } from "@/styles/colors";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { stockType } from "@/tools/products/addToStock";
import { ReactElement, useContext, useEffect, useState } from "react";
import styled, { css } from "styled-components";

const FadeContainer = styled(Container)<{ $fade: boolean }>`
  &:after {
    content: "";
    ${(props) =>
      !props.$fade &&
      css`
        display: none;
      `}
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: not-allowed;
  }
  ${(props) =>
    props.$fade &&
    css`
      opacity: 0.3;
    `}
`;

const MainContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-auto-rows: 22px;
  gap: 10px;
`;

const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: 1 / 6;
  grid-row: 1 / 8;
`;

// const Chart = styled.div`
//   flex: 1;
//   background-color: #ccc;
//   border-radius: 20px;
// `;

const StockContainer = styled.div`
  grid-column: 6 / 9;
  grid-row-start: 1;
`;

const StockMapContainer = styled(Container)`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, 1fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  /* padding: 10px;
  border: solid 2px ${globalCSSVars["--foreground"]}; */
  border-radius: 20px;
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

const FormContainer = styled.div`
  display: grid;
  grid-column: 1 / 6;
  grid-row: 9 / 15;
`;

const Page: NextPageWithLayout = () => {
  const { selectedProduct } = useContext(ProductContext);
  const product = useGetProduct();

  const [entryToEdit, setEntryToEdit] = useState<stockType | undefined>();
  const [stock, setStock] = useState<stockType[]>([]);

  // function to select and unselect a entry
  function handlerSelectEntry(stock: stockType) {
    if (entryToEdit === stock) setEntryToEdit(undefined);
    else setEntryToEdit(stock);
  }

  // effect to sort the product stock by date
  useEffect(() => {
    const s = product.data?.stock;
    if (!s || s?.length === 0) {
      setStock([]);
      return;
    }

    const stock = s.sort((a, b) => {
      return b.created_at.seconds - a.created_at.seconds;
    });

    setStock(stock);
  }, [product.data?.stock]);

  useEffect(() => {
    setEntryToEdit(undefined);
  }, [selectedProduct]);

  return (
    <Container>
      <p>
        <i>
          Para ver información de un producto seleccionelo en la lista de
          productos
        </i>
      </p>
      <FadeContainer $fade={selectedProduct ? false : true}>
        <h1>{selectedProduct?.data().name}</h1>
        <MainContainer>
          <ChartContainer>
            <h3>Ventas semanales</h3>
            <SalesComparisonChart />
          </ChartContainer>
          <StockContainer>
            <h3>Existencias</h3>
            {stock.length > 0 && <p>Para editar una entrada seleccionela</p>}
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
                          {_.amount} {product.data?.units}
                          <FlexContainer>
                            <Container styles={{ marginRight: "10px" }}>
                              Costo {_.purchase_price} -
                            </Container>
                            <Container styles={{ marginRight: "10px" }}>
                              Precio {_.sale_price} -
                            </Container>
                            <Container>
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
          </StockContainer>
          <FormContainer>
            <FormToAddStock
              stock={stock}
              entryToEdit={entryToEdit}
              setEntryToEdit={setEntryToEdit}
            />
          </FormContainer>
        </MainContainer>
      </FadeContainer>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;
