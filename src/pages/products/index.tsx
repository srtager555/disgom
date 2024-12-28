import { InputNumber } from "@/components/Inputs/number";
import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { useGetProduct } from "@/hooks/products/getProduct";
import { NextPageWithLayout } from "@/pages/_app";
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

const Page: NextPageWithLayout = () => {
  const { selectedProduct, setSelectedProduct } = useContext(ProductContext);
  const product = useGetProduct();
  const [stock, setStock] = useState<stockType[]>();
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

    const purchase_price = Number(productSalePrice.value);
    const sale_price = Number(productCostPrice.value);
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
    if (!s) return;

    const stock = s.sort((a, b) => {
      return b.created_at.seconds - a.created_at.seconds;
    });

    setStock(stock);
  }, [product.data?.stock]);

  useEffect(() => {
    console.log(stock);
  }, [stock]);

  return (
    <Container>
      <p>
        <i>
          Para ver información de un producto seleccionelo en la lista de
          productos
        </i>
      </p>
      <h1>{selectedProduct?.data().name}</h1>
      <FlexContainer>
        <Container styles={{ marginRight: "10px" }}>
          <h3>Ventas semanales</h3>
          <Container
            styles={{
              width: "500px",
              height: "180px",
              backgroundColor: "#ccc",
              borderRadius: "20px",
              marginBottom: "20px",
            }}
          ></Container>
        </Container>
        <Container>
          <h3>Existencias</h3>
          <Container
            styles={{
              width: "300px",
              height: "180px",
              backgroundColor: "#ccc",
              borderRadius: "20px",
              marginBottom: "20px",
            }}
          ></Container>
        </Container>
      </FlexContainer>
      <Form ref={formRef} onSubmit={handlerOnSubmit}>
        <h3>Cargar producto</h3>
        <FlexContainer>
          <Container styles={{ width: "80px" }}>
            <InputNumber name="productCostPrice" inline required>
              Costó
            </InputNumber>
          </Container>
          <Container styles={{ width: "130px" }}>
            <InputNumber name="productSalePrice" inline required>
              Gan. empresa
            </InputNumber>
          </Container>
          <Container styles={{ width: "130px" }}>
            <InputNumber name="sellerProfit" inline required>
              Gan. vendedor
            </InputNumber>
          </Container>
          <Container styles={{ width: "100px" }}>
            <InputNumber defaultValue={0} inline name="amount" required>
              Ingresó{" "}
              {selectedProduct?.data() ? `${selectedProduct.data().units}` : ""}
            </InputNumber>
          </Container>
        </FlexContainer>
        <Button>Agregar carga</Button>
      </Form>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;
