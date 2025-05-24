import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { CreateProduct } from "@/components/pages/products/Create";
// import { TagManager } from "@/components/pages/products/TagManager";
import { NextPageWithLayout } from "@/pages/_app";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { disableProduct } from "@/tools/products/disable";
import { FormEvent, ReactElement, useContext, useState } from "react";

const Page: NextPageWithLayout = () => {
  const { selectedProduct, setSelectedProduct } = useContext(ProductContext);
  const [timeOut, setTimeOut] = useState<NodeJS.Timeout>();

  function handlerDisableProduct(e: FormEvent) {
    e.preventDefault();
    const timeout = setTimeout(async () => {
      if (selectedProduct) await disableProduct(selectedProduct.ref);

      if (setSelectedProduct) setSelectedProduct(undefined);
    }, 5000);

    setTimeOut(timeout);
  }

  return (
    <Container>
      <CreateProduct />
      <FlexContainer
        styles={{ gap: "10px", alignItems: "center", marginTop: "10px" }}
      >
        {selectedProduct && (
          <Button
            onPointerDown={handlerDisableProduct}
            onPointerUp={() => clearTimeout(timeOut)}
            onMouseUp={() => clearTimeout(timeOut)}
            onMouseLeave={() => clearTimeout(timeOut)}
            $warn
            $hold
          >
            Eliminar producto
          </Button>
        )}
        {selectedProduct && (
          <Button
            onClick={() => setSelectedProduct && setSelectedProduct(undefined)}
          >
            Eliminar selección
          </Button>
        )}
      </FlexContainer>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;
