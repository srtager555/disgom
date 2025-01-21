import SalesComparisonChart from "@/components/chart";
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
import { EditEntry } from "@/tools/products/editEntry";
import { removeEntry } from "@/tools/products/removeEntry";
import { getDoc, updateDoc } from "firebase/firestore";
import {
  ChangeEvent,
  FormEvent,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  grid-row: 8 / 14;
`;

const Page: NextPageWithLayout = () => {
  const { selectedProduct } = useContext(ProductContext);
  const product = useGetProduct();
  const [timeoutSaved, setTimeoutSaved] = useState<NodeJS.Timeout>();
  const [entryToEdit, setEntryToEdit] = useState<stockType | undefined>();
  const [originalAmount, setOriginalAmount] = useState(0);
  const [stock, setStock] = useState<stockType[]>([]);
  const [defaultCost, setDefaultCost] = useState(0);
  const [dynamicMinCost, setDynamicMinCost] = useState<number | undefined>(
    undefined
  );
  const [defaultProfitOwner, setDefaultProfitOwner] = useState(0);
  const [defaultProfitSeller, setDefaultProfitSeller] = useState(0);
  const [dynamicMinSeller, setDynamicMinSeller] = useState<number | undefined>(
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const costRef = useRef<HTMLInputElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);

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

    if (entryToEdit) {
      await EditEntry(selectedProduct.ref, entryToEdit, {
        amount: Number(amount.value),
        purchase_price,
        sale_price,
        seller_profit,
      });

      setEntryToEdit(undefined);
    } else {
      await addEntry(selectedProduct?.ref, {
        amount: Number(amount.value),
        purchase_price,
        sale_price,
        seller_profit,
      });
    }

    formRef.current?.reset();
  };

  async function disableProductManager(e: unknown) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    e.preventDefault();

    if (!product.snap?.ref || !product.data) return;
    await updateDoc(product.snap.ref, { disabled: !product.data.disabled });
  }

  // functions to remove a stock
  function handlerRemoveStock() {
    setTimeoutSaved(
      setTimeout(async () => {
        if (!entryToEdit || !selectedProduct?.ref) return;
        await removeEntry(entryToEdit, selectedProduct?.ref, false);

        setEntryToEdit(undefined);
      }, 5000)
    );
  }
  function handlerCancelRemoveStock() {
    clearTimeout(timeoutSaved);
  }

  // functions to manage the min input value
  function handlerOnChangeOwnerMin(e: ChangeEvent<HTMLInputElement>) {
    const newMin = e.target.value;
    setDynamicMinCost(Number(newMin));
  }
  function handlerOnChangeSellerMin(e: ChangeEvent<HTMLInputElement>) {
    const newMin = e.target.value;
    setDynamicMinSeller(Number(newMin));
  }

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

  // effect to set the default values in the inputs
  // if there is a entry selected the code will put their values
  // in the default input values
  useEffect(() => {
    if (!stock || stock?.length === 0) {
      setDefaultCost(0);
      setDefaultProfitOwner(0);
      setDefaultProfitSeller(0);

      return;
    }

    const currentPriceData = stock[0];

    setDefaultCost(
      entryToEdit?.purchase_price ?? currentPriceData.purchase_price
    );
    setDefaultProfitOwner(
      entryToEdit?.sale_price ?? currentPriceData.sale_price
    );
    setDefaultProfitSeller(
      entryToEdit?.seller_profit ?? currentPriceData.seller_profit
    );
  }, [stock, entryToEdit]);

  // effect to get the original entry amount
  useEffect(() => {
    async function getEntry() {
      if (!entryToEdit) {
        setOriginalAmount(0);
        return;
      }

      const query = await getDoc(entryToEdit.entry_ref);
      const originalAmount = query.data()?.amount;

      if (originalAmount) setOriginalAmount(originalAmount);
    }
    getEntry();
  }, [entryToEdit]);

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
              <h3>Crear una nueva entrada</h3>
              <p>
                {entryToEdit
                  ? "Edita la entrada seleccionada"
                  : "Ingresa nuevo producto al stock."}
              </p>
              <FlexContainer>
                <Container styles={{ width: "80px" }}>
                  <InputNumber
                    ref={costRef}
                    defaultValue={defaultCost}
                    min={0}
                    step={0.01}
                    onChange={handlerOnChangeOwnerMin}
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
                    onChange={handlerOnChangeSellerMin}
                    min={dynamicMinCost ?? defaultCost}
                    defaultValue={defaultProfitOwner}
                    name="productSalePrice"
                    step="0.01"
                    inline
                    required
                  >
                    P. Venta
                  </InputNumber>
                </Container>
                <Container styles={{ width: "110px" }}>
                  <InputNumber
                    min={dynamicMinSeller ?? defaultProfitOwner}
                    defaultValue={defaultProfitSeller}
                    name="sellerProfit"
                    step="0.01"
                    inline
                    required
                  >
                    P. Vendedor
                  </InputNumber>
                </Container>
                <Container styles={{ width: "110px" }}>
                  <InputNumber
                    defaultValue={entryToEdit?.amount}
                    inline
                    name="amount"
                    required
                    step="0.01"
                  >
                    {entryToEdit ? (
                      <>Stock ({originalAmount})</>
                    ) : (
                      <>
                        Ingresó{" "}
                        {selectedProduct?.data()
                          ? `${selectedProduct.data().units}`
                          : ""}
                      </>
                    )}
                  </InputNumber>
                </Container>
              </FlexContainer>
              <FlexContainer
                styles={{
                  display: "inline-flex",
                  justifyContent: "space-between",
                }}
              >
                <Button>
                  {entryToEdit ? "Editar entrada" : "Agregar entrada"}
                </Button>
                <Button onClick={disableProductManager}>
                  {!product.data?.disabled ? "Deshabilitar" : "habilitar"}
                </Button>
              </FlexContainer>
              {entryToEdit && (
                <Button
                  $warn
                  $hold
                  onPointerDown={handlerRemoveStock}
                  onPointerUp={handlerCancelRemoveStock}
                  onPointerLeave={handlerCancelRemoveStock}
                >
                  {entryToEdit.amount === originalAmount
                    ? "Eliminar entrada"
                    : "Eliminar existencias"}
                </Button>
              )}
            </Form>
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
