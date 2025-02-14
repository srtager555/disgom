import { productDoc } from "@/tools/products/create";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { ProductContainer } from "../../ProductList";
import { useMemo } from "react";
import { Column } from "../../Product";
import styled from "styled-components";
import { SellersDoc } from "@/tools/sellers/create";
import { useGetInventoryByProduct } from "@/hooks/invoice/getInventoryByProduct";

const GrabButton = styled.button`
  display: inline-block;
  width: 100%;
  height: 100%;
  border: none;
  text-decoration: none !important;
  background-color: transparent;

  &:active {
    cursor: grabbing;
  }
  &:hover {
    cursor: grab;
  }
`;

// サラマンダー
type props = {
  doc: QueryDocumentSnapshot<productDoc>;
  selectedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
};

export function Product({ doc, selectedSeller }: props) {
  const data = useMemo(() => doc.data(), [doc]);
  const selectedSellerData = useMemo(
    () => selectedSeller?.data(),
    [selectedSeller]
  );
  const inventory = useGetInventoryByProduct();

  return (
    <ProductContainer
      $hide={false}
      $hasInventory={selectedSellerData?.hasInventory}
      $withoutStock={1}
    >
      <Column>
        <GrabButton>-</GrabButton>
      </Column>
      <Column gridColumn="2 / 5">{data.name}</Column>
      <Column>0</Column>
    </ProductContainer>
  );
}
