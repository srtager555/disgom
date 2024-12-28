import { InputNumber } from "@/components/Inputs/number";
import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { NextPageWithLayout } from "@/pages/_app";
import { Button, Form } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { addEntry } from "@/tools/products/addEntry";
import { FormEvent, ReactElement, useContext } from "react";

const Page: NextPageWithLayout = () => {
  const { selectedProduct } = useContext(ProductContext);

  const handlerOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const { productCostPrice, productSalePrice, amount } =
      e.target as EventTarget & {
        productCostPrice: HTMLInputElement;
        productSalePrice: HTMLInputElement;
        amount: HTMLInputElement;
      };

    const cost_price = Number(productSalePrice.value);
    const sale_price = Number(productCostPrice.value);

    await addEntry(selectedProduct?.ref, {
      amount: Number(amount.value),
      sale_price: sale_price,
      purchase_price: cost_price,
    });
  };

  return (
    <Container>
      <Container>
        <h2>Ventas semanales</h2>
        <Container
          styles={{
            width: "500px",
            height: "200px",
            backgroundColor: "#ccc",
            borderRadius: "20px",
            marginBottom: "20px",
          }}
        ></Container>
      </Container>
      <Form onSubmit={handlerOnSubmit}>
        <h2>Cargar producto</h2>
        <FlexContainer>
          <Container styles={{ width: "150px" }}>
            <InputNumber name="productCostPrice" inline required>
              Precio de comprá
            </InputNumber>
          </Container>
          <Container styles={{ width: "150px" }}>
            <InputNumber name="productSalePrice" inline required>
              Precio de venta
            </InputNumber>
          </Container>
          <Container styles={{ width: "100px" }}>
            <InputNumber defaultValue={0} inline name="amount" required>
              Ingresó
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
