import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { CreateProduct } from "@/components/pages/products/Create";
import { ManageStock } from "@/components/pages/products/ManageStock";
import { ProductMetrics } from "@/components/pages/products/ProductMetrics";
// import { TagManager } from "@/components/pages/products/TagManager";
import { NextPageWithLayout } from "@/pages/_app";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { disableProduct } from "@/tools/products/disable";
import { updateDoc } from "firebase/firestore";
import { FormEvent, ReactElement, useContext, useMemo, useState } from "react";

const Page: NextPageWithLayout = () => {
  const { selectedProduct, setSelectedProduct } = useContext(ProductContext);
  const productData = useMemo(() => selectedProduct?.data(), [selectedProduct]);
  const [timeOut, setTimeOut] = useState<NodeJS.Timeout>();
  const [changeChartMode, setChangeChartMode] = useState(false);

  function handlerDisableProduct(e: FormEvent) {
    e.preventDefault();
    const timeout = setTimeout(async () => {
      if (selectedProduct && !productData?.disabled)
        await disableProduct(selectedProduct.ref);
      else if (selectedProduct && productData?.disabled) {
        await updateDoc(selectedProduct.ref, {
          disabled: false,
        });
      }

      if (setSelectedProduct) setSelectedProduct(undefined);
    }, 5000);

    setTimeOut(timeout);
  }

  return (
    <Container>
      <CreateProduct
        setChangeChartMode={setChangeChartMode}
        changeChartMode={changeChartMode}
      />
      {changeChartMode ? (
        <ProductMetrics />
      ) : (
        <>
          <ManageStock />
          <FlexContainer
            styles={{ gap: "10px", alignItems: "center", marginTop: "10px" }}
          >
            {selectedProduct && (
              <>
                <Button
                  onClick={() =>
                    setSelectedProduct && setSelectedProduct(undefined)
                  }
                >
                  Eliminar selección
                </Button>
              </>
            )}
            {selectedProduct && (
              <Button
                onPointerDown={handlerDisableProduct}
                onPointerUp={() => clearTimeout(timeOut)}
                onMouseUp={() => clearTimeout(timeOut)}
                onMouseLeave={() => clearTimeout(timeOut)}
                $warn
                $hold
              >
                {productData?.disabled
                  ? "Habilitar producto"
                  : "Deshabilitar producto"}
              </Button>
            )}
          </FlexContainer>
        </>
      )}
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;
