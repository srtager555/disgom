import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { ReactElement, useContext, useEffect } from "react";
import { NextPageWithLayout } from "../_app";
import { FlexContainer, GridContainer } from "@/styles/index.styles";
import { Column } from "@/components/pages/invoice/Product";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { useGetProducts } from "@/hooks/products/getProducts";

const Page: NextPageWithLayout = () => {
  const productsContext = useContext(ProductContext);
  const products = useGetProducts();

  useEffect(() => {
    if (productsContext?.setShowProductsList)
      productsContext?.setShowProductsList(false);
    if (productsContext?.setHideBorder) productsContext?.setHideBorder(true);

    return () => {
      if (productsContext?.setShowProductsList)
        productsContext?.setShowProductsList(true);
      if (productsContext?.setHideBorder) productsContext?.setHideBorder(false);
    };
  }, [productsContext]);

  return (
    <FlexContainer
      styles={{ justifyContent: "center", flexDirection: "column" }}
    >
      <h1 style={{ textAlign: "center" }}>
        Inventarios de todos los vendedores
      </h1>
      <DescriptionWithSellers />
      {products.docs?.map((product) => (
        <ProductInventory key={product.id} name={product.data().name} />
      ))}
    </FlexContainer>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;

const productNameWidth = "200px";

const DescriptionWithSellers = () => {
  const sellers = useGetSellers();
  return (
    <GridContainer grisTemplateColumns={productNameWidth}>
      <Column>Productos</Column>
      {sellers?.docs
        .sort((a, b) => a.data().name.localeCompare(b.data().name))
        .map((seller) => (
          <Column
            $textAlign="center"
            key={seller.id}
            title={seller.data().name}
          >
            {seller.data().name}
          </Column>
        ))}
      <Column>Total</Column>
    </GridContainer>
  );
};

type props = {
  name: string;
};

const ProductInventory = ({ name }: props) => {
  return (
    <GridContainer grisTemplateColumns={productNameWidth}>
      <Column>{name}</Column>
      <Column>0</Column>
    </GridContainer>
  );
};
