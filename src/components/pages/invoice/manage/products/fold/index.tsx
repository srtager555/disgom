import { Icon } from "@/components/Icons";
import { Column } from "../../../Product";
import { Container } from "@/styles/index.styles";
import { Dispatch, SetStateAction } from "react";
import { SellersDoc } from "@/tools/sellers/create";
import { ProductContainer } from "../../../ProductList";
import { SaleDesc } from "./SaleDesc";
import { DocumentReference } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";

type props = {
  setIsFolded: Dispatch<SetStateAction<boolean>>;
  isFolded: boolean;
  selectedSellerData: SellersDoc | undefined;
  product_ref: DocumentReference<productDoc>;
};

export function Fold({
  setIsFolded,
  isFolded,
  selectedSellerData,
  product_ref,
}: props) {
  return (
    <>
      <Column
        className="hide-print"
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
          <SaleDesc product_ref={product_ref} />
        </ProductContainer>
      )}
    </>
  );
}
