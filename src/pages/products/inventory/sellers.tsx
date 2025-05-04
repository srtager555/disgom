import { FlexContainer, GridContainer } from "@/styles/index.styles";
import { Column } from "@/components/pages/invoice/Product";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { useGetProducts } from "@/hooks/products/getProducts";

// Importa tipos necesarios
import { QueryDocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { SellersDoc } from "@/tools/sellers/create";
import { useMemo } from "react";

const gridTemplate = "65px 175px";

export default function Page() {
  const products = useGetProducts();
  const sellers = useGetSellers(); // Obtener vendedores aquí

  // Filtrar y ordenar vendedores una sola vez
  const activeSellers = useMemo(() => {
    return sellers?.docs
      .filter((el) => el.data().hasInventory)
      .sort((a, b) => a.data().name.localeCompare(b.data().name)) ?? []; // Manejar caso undefined
  }, [sellers.docs]);

  return (
    <FlexContainer
      styles={{ justifyContent: "center", flexDirection: "column" }}
    >
      <h1 style={{ textAlign: "center" }}>Inventarios de los vendedores</h1>
      <DescriptionWithSellers sellers={activeSellers} /> {/* Pasar vendedores */}
      {products.docs?.map((product) => (
        <ProductInventory
          key={product.id}
          product={product} {/* Pasar producto completo */}
          sellers={activeSellers} {/* Pasar vendedores */}
        />
      ))}
    </FlexContainer>
  );
};

const DescriptionWithSellers = () => {
  const sellers = useGetSellers();
type DescriptionProps = {
  sellers: Array<QueryDocumentSnapshot<SellersDoc>>; // Recibe vendedores como prop
};

const DescriptionWithSellers = ({ sellers }: DescriptionProps) => {
  return (
    <GridContainer $gridTemplateColumns={gridTemplate}>
      <Column>Inv</Column>
      <Column gridColumn="span 2">Productos</Column>
      {sellers.map((seller) => ( // Usar la lista de props
          <Column
            $textAlign="center"
            key={seller.id}
            title={seller.data().name}
          >
            {seller.data().name}
          </Column>
        ))}
      <Column>Total</Column>
      <Column>Precio</Column>
      <Column>Valor</Column>
    </GridContainer>
  );
};

type props = {
  product: QueryDocumentSnapshot<productDoc>; // Recibe el producto completo
  sellers: Array<QueryDocumentSnapshot<SellersDoc>>; // Recibe los vendedores
};

const ProductInventory = ({ product, sellers }: props) => {
  const name = product.data().name; // Acceder al nombre desde el producto
  return (
    <GridContainer $gridTemplateColumns={gridTemplate}>
      <Column>100</Column>
      <Column gridColumn="span 2">{name}</Column>
      <Column>0</Column>
    </GridContainer>
  );
};
