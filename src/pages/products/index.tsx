import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { useContext, ReactElement, useEffect } from "react";
import { NextPageWithLayout } from "../_app";
import { Container, GridContainer } from "@/styles/index.styles";
import { Column } from "@/components/pages/invoice/Product";
import { useGetProducts } from "@/hooks/products/getProducts";
import { numberParser } from "@/tools/numberPaser";

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
    <Container>
      <h1>Vista general del inventario actual</h1>
      <Description />
      {products.docs?.map((el, i) => {
        const data = el.data();
        const totalStock = data.stock.reduce(
          (acc, item) => acc + item.amount,
          0
        );
        const price = data.stock[0]?.sale_price || 0;
        const product_value = totalStock * price;

        return (
          <GridContainer $gridTemplateColumns="200px" key={i}>
            <Column>{data.name}</Column>
            <Column>0</Column>
            <Column>0</Column>
            <Column title={numberParser(totalStock)}>
              {numberParser(totalStock)}
            </Column>
            <Column>{numberParser(price)}</Column>
            <Column title={numberParser(product_value)}>
              {numberParser(product_value)}
            </Column>
          </GridContainer>
        );
      })}
    </Container>
  );
};

const Description = () => (
  <GridContainer $gridTemplateColumns="200px">
    <Column>Producto</Column>
    <Column $textAlign="center">Cargado</Column>
    <Column $textAlign="center">Vendido</Column>
    <Column $textAlign="center">Actual</Column>
    <Column $textAlign="center">Precio</Column>
    <Column $textAlign="center">Valor</Column>
  </GridContainer>
);

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;
