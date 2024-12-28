import { InputNumber } from "@/components/Inputs/number";
import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { useGetProduct } from "@/hooks/products/getProduct";
import { NextPageWithLayout } from "@/pages/_app";
import { globalCSSVars } from "@/styles/colors";
import { Button, Form } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { addEntry } from "@/tools/products/addEntry";
import { stockType } from "@/tools/products/addToStock";
import {
  FormEvent,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components";

const MainContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-auto-rows: 25px;
  gap: 10px;
`;

const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: 1 / 6;
  grid-row: 1 / 8;
`;

const Chart = styled.div`
  flex: 1;
  background-color: #ccc;
  border-radius: 20px;
`;

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

const StockButton = styled(Button)`
  text-align: start;
  padding: 5px;
  width: 100%;

  &:hover {
    transform: scale(1.02);
  }
  &:active {
    transform: scale(0.95);
  }
`;

const FormContainer = styled.div`
  display: grid;
  grid-column: 1 / 5;
  grid-row: 8 / 13;
`;

const Page: NextPageWithLayout = () => {
  const { selectedProduct } = useContext(ProductContext);
  const product = useGetProduct();
  const [stock, setStock] = useState<stockType[]>();
  const costRef = useRef<HTMLInputElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);
  const [defaultCost, setDefaultCost] = useState(0);
  const [defaultProfitOwner, setDefaultProfitOwner] = useState(0);
  const [defaultProfitSeller, setDefaultProfitSeller] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const handlerOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const { productCostPrice, productSalePrice, sellerProfit, amount } =
      e.target as EventTarget & {
        sellerProfit: HTMLInputElement;
        productCostPrice: HTMLInputElement;
        productSalePrice: HTMLInputElement;
        amount: HTMLInputElement;
      };

    const purchase_price = Number(productCostPrice.value);
    const sale_price = Number(productSalePrice.value);
    const seller_profit = Number(sellerProfit.value);

    await addEntry(selectedProduct?.ref, {
      amount: Number(amount.value),
      purchase_price,
      sale_price,
      seller_profit,
    });

    formRef.current?.reset();
  };

  useEffect(() => {
    const s = product.data?.stock;
    if (!s) {
      setStock(undefined);
      return;
    }

    const stock = s.sort((a, b) => {
      return b.created_at.seconds - a.created_at.seconds;
    });

    setStock(stock);
  }, [product.data?.stock]);

  useEffect(() => {
    if (!stock || stock?.length === 0) {
      setDefaultCost(0);
      setDefaultProfitOwner(0);
      setDefaultProfitSeller(0);

      return;
    }

    const currentPriceData = stock[0];

    setDefaultCost(currentPriceData.purchase_price);
    setDefaultProfitOwner(currentPriceData.sale_price);
    setDefaultProfitSeller(currentPriceData.seller_profit);
  }, [stock]);

  // dinamyc min in sale price
  useEffect(() => {
    if (!costRef) return;
  }, [costRef]);

  return (
    <Container>
      <p>
        <i>
          Para ver información de un producto seleccionelo en la lista de
          productos
        </i>
      </p>
      <h1>{selectedProduct?.data().name}</h1>
      <MainContainer>
        <ChartContainer>
          <h3>Ventas semanales</h3>
          <Chart />
        </ChartContainer>
        <StockContainer>
          <h3>Existencias</h3>
          {stock && <p>Para editar una entrada seleccionela</p>}
          <StockMapContainer>
            {!stock ? (
              <p>No hay existencia de este producto</p>
            ) : (
              <>
                {stock.map((_, i) => {
                  return (
                    <Container key={i} styles={{ width: "100%" }}>
                      <StockButton>
                        {_.created_at.toDate().toLocaleDateString()} - hay{" "}
                        {_.amount} {product.data?.units}
                        <FlexContainer>
                          <Container styles={{ marginRight: "10px" }}>
                            Costo {_.purchase_price} -
                          </Container>
                          <Container styles={{ marginRight: "10px" }}>
                            Precio {_.sale_price} -
                          </Container>
                          <Container>Vendedor {_.seller_profit}</Container>
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
          <Form ref={formRef} onSubmit={handlerOnSubmit}>
            <h3>Cargar producto</h3>
            <FlexContainer>
              <Container styles={{ width: "80px" }}>
                <InputNumber
                  ref={costRef}
                  defaultValue={defaultCost}
                  min={0}
                  name="productCostPrice"
                  inline
                  required
                >
                  Costó
                </InputNumber>
              </Container>
              <Container styles={{ width: "80px" }}>
                <InputNumber
                  ref={ownerRef}
                  min={defaultCost}
                  defaultValue={defaultProfitOwner}
                  name="productSalePrice"
                  inline
                  required
                >
                  P. Venta
                </InputNumber>
              </Container>
              <Container styles={{ width: "110px" }}>
                <InputNumber
                  min={defaultProfitOwner}
                  defaultValue={defaultProfitSeller}
                  name="sellerProfit"
                  inline
                  required
                >
                  P. Vendedor
                </InputNumber>
              </Container>
              <Container styles={{ width: "100px" }}>
                <InputNumber defaultValue={0} inline name="amount" required>
                  Ingresó{" "}
                  {selectedProduct?.data()
                    ? `${selectedProduct.data().units}`
                    : ""}
                </InputNumber>
              </Container>
            </FlexContainer>
            <Button>Agregar carga</Button>
          </Form>
        </FormContainer>
      </MainContainer>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;
