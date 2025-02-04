import { HideWithoutStock } from "@/components/pages/products/HideWithoutStock";
import { SelectTag } from "@/components/pages/products/SelectTag";
import { useGetProducts } from "@/hooks/products/getProducts";
import { Container, FlexContainer } from "@/styles/index.styles";
import { useState } from "react";
import { Descriptions } from "../../ProductList";
import { SellersDoc } from "@/tools/sellers/create";
import { QueryDocumentSnapshot } from "firebase/firestore";

type props = {
  selectedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
};

export function Products({ selectedSeller }: props) {
  const [tagSelected, setTagSelected] = useState("");
  const productsList = useGetProducts(tagSelected);
  const [hideProductWithoutStock, setHideProductWithoutStock] = useState(false);

  return (
    <Container styles={{ margin: "20px 0px" }}>
      <FlexContainer styles={{ marginBottom: "20px" }}>
        <SelectTag setTagSelected={setTagSelected} />
        <Container styles={{ marginRight: "20px" }}>
          <HideWithoutStock
            setHideProductWithoutStock={setHideProductWithoutStock}
            hideProductWithoutStock={hideProductWithoutStock}
          />
        </Container>
      </FlexContainer>
      <Container styles={{ marginBottom: "20px" }}>
        <Descriptions hasInventory={selectedSeller?.data().hasInventory} />
        {productsList?.docs?.map((product) => {
          return <></>;
        })}
      </Container>
    </Container>
  );
}
