import { ProductsLayout } from "@/components/layouts/Products.layout";
import { NextPageWithLayout } from "@/pages/_app";
import { Button } from "@/styles/Form.styles";
import { Container } from "@/styles/index.styles";
import { ReactElement } from "react";

const Page: NextPageWithLayout = () => {
  return (
    <Container>
      <h2>Lista de productos</h2>
      <p>La lista de todos los productos que hay</p>
      <Button
        onClick={() => {
          window.print();
        }}
      >
        Imprimir
      </Button>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;
