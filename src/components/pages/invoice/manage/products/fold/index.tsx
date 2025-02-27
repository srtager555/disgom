import { Icon } from "@/components/Icons";
import { Column } from "../../../Product";
import { Container } from "@/styles/index.styles";
import { Dispatch, SetStateAction } from "react";
import { SellersDoc } from "@/tools/sellers/create";
import { ProductContainer } from "../../../ProductList";
import { SaleDesc } from "./SaleDesc";

type props = {
  setIsFolded: Dispatch<SetStateAction<boolean>>;
  isFolded: boolean;
  selectedSellerData: SellersDoc | undefined;
  product_id: string;
};

export function Fold({
  setIsFolded,
  isFolded,
  selectedSellerData,
  product_id,
}: props) {
  return (
    <>
      <Column
        style={{ cursor: "pointer" }}
        onClick={() => {
          setIsFolded(!isFolded);
        }}
      >
        <Container styles={{ marginRight: "10px" }}>
          <Icon iconType={isFolded ? "fold" : "unfold"} />
        </Container>
      </Column>
      {!isFolded && selectedSellerData && (
        <ProductContainer
          $hasInventory={selectedSellerData.hasInventory}
          $children
          $withoutStock={1}
          $fold
        >
          <SaleDesc id={product_id} />
        </ProductContainer>
      )}
    </>
  );
}
