import { ProductContext } from "@/components/layouts/Products.layout";
import { useContext, useEffect, useState } from "react";
import { NextPageWithLayout } from "../../_app";
import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Column } from "@/components/pages/invoice/Product";
import { useGetProducts } from "@/hooks/products/getProducts";
import { numberParser } from "@/tools/numberPaser";
import { Button } from "@/styles/Form.styles";
import { useMemo } from "react";
import { productDoc } from "@/tools/products/create";

const Page: NextPageWithLayout = () => {
  const productsContext = useContext(ProductContext);
  const [order, setOrder] = useState<keyof productDoc>("position");
  const [orderByName, setOrderByName] = useState(false);
  const products = useGetProducts(order);

  function handlerOnClick() {
    if (orderByName) {
      setOrder("name");
      setOrderByName(false);
    } else {
      setOrder("position");
      setOrderByName(true);
    }
  }

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
    <FlexContainer styles={{ flexDirection: "column", alignItems: "center" }}>
      <FlexContainer
        styles={{
          marginBottom: "20px",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <h1 style={{ textAlign: "center" }}>Inventario actual</h1>
        <Button onClick={() => window.print()}>Imprimir</Button>
        <Button onClick={handlerOnClick}>
          Ordenado por {orderByName ? "Nombre" : "Posición"}
        </Button>
      </FlexContainer>
      <Container
        styles={{
          marginBottom: "20px",
          maxWidth: "625px",
        }}
      >
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
              <Column gridColumn="span 2">{data.name}</Column>
              {/* <Column>0</Column>
              <Column>0</Column> */}
              <Column title={numberParser(totalStock)}>
                {numberParser(totalStock)}
              </Column>
              <Column>{numberParser(price)}</Column>
              <Column title={numberParser(product_value)} gridColumn="span 2">
                {numberParser(product_value)}
              </Column>
            </GridContainer>
          );
        })}
        <TotalInventory products={products.docs} />
      </Container>
      <Button onClick={() => window.print()}>Imprimir</Button>
    </FlexContainer>
  );
};

const TotalInventory = ({
  products,
}: {
  products: ReturnType<typeof useGetProducts>["docs"];
}) => {
  const total = useMemo(() => {
    let totalValue = 0;
    products?.forEach((el) => {
      const data = el.data();
      const totalStock = data.stock.reduce((acc, item) => acc + item.amount, 0);
      const price = data.stock[0]?.sale_price || 0;
      const product_value = totalStock * price;
      totalValue = totalValue + product_value;
    });
    return totalValue;
  }, [products]);

  return (
    <GridContainer $gridTemplateColumns="200px">
      <Column gridColumn="span 4" $textAlign="end">
        TOTAL LPS
      </Column>
      <Column gridColumn="span 2">{numberParser(total)}</Column>
    </GridContainer>
  );
};

const Description = () => (
  <GridContainer
    $gridTemplateColumns="200px"
    styles={{ position: "sticky", top: "0" }}
  >
    <Column gridColumn="span 2">Producto</Column>
    {/* <Column $textAlign="center">Cargado</Column>
    <Column $textAlign="center">Vendido</Column> */}
    <Column $textAlign="center">Cantidad</Column>
    <Column $textAlign="center">Precio</Column>
    <Column $textAlign="center">Valor</Column>
  </GridContainer>
);

export default Page;
