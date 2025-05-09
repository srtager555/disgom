import { Days } from "@/components/pages/invoice/manage/Closing/Data";
import { Column } from "@/components/pages/invoice/Product";
import { useGetProducts } from "@/hooks/products/getProducts";
import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import Link from "next/link";
import { ProductRow } from "@/components/pages/products/manage/ProductRow";

const grid = "225px repeat(8, 150px)";
const FlexCenterStyles = {
  width: "100%",
  height: "100%",
  justifyContent: "center",
  alignItems: "center",
};

export default function Page() {
  const products = useGetProducts();

  return (
    <Container>
      <Container styles={{ width: "60%", marginBottom: "30px" }}>
        <h1>Entradas y salidas de productos</h1>
        <p>
          Aqui se pueden ingresar los productos directamente, pero si hay un
          cambio de precio{" "}
          <Link href="/products/detailed/" className="show-style">
            dirijase a la pagina relaciona a este texto(click aquí)
          </Link>
        </p>
      </Container>
      <Container styles={{ width: "100%" }}>
        <Descriptions />
        {products.docsWithoutParent?.map((el, i) => {
          return <ProductRow key={i} product={el} />;
        })}
      </Container>
    </Container>
  );
}

const Descriptions = () => {
  return (
    <GridContainer
      $gridTemplateColumns={grid}
      $width={"1430px"}
      styles={{ position: "sticky", top: "0", zIndex: "2" }}
    >
      <Column
        $textAlign="center"
        styles={{ position: "sticky", left: "0", zIndex: "1" }}
      >
        <FlexContainer styles={FlexCenterStyles}>
          <span>PRODUCTO</span>
        </FlexContainer>
      </Column>
      {Days.map((el) => el.toUpperCase()).map((el, i) => {
        return (
          <Column $textAlign="center" key={i}>
            <FlexContainer styles={{ flexDirection: "column" }}>
              <span>{el}</span>
              <GridContainer $isChildren $gridTemplateColumns="1fr 1fr">
                <Column $textAlign="center">Entrada</Column>
                <Column $textAlign="center">Salida</Column>
              </GridContainer>
            </FlexContainer>
          </Column>
        );
      })}
      <Column $textAlign="center">
        <FlexContainer styles={FlexCenterStyles}>TOTAL</FlexContainer>
      </Column>
    </GridContainer>
  );
};
