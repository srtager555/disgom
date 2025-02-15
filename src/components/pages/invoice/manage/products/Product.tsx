import { productDoc } from "@/tools/products/create";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { ProductContainer } from "../../ProductList";
import { memo, useMemo, useState } from "react";
import { Column, Input } from "../../Product";
import styled from "styled-components";
import { SellersDoc } from "@/tools/sellers/create";
import { AddOutput } from "./AddOutput";
import { MemoProductSold } from "./ProductSold";

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

export const MemoProduct = memo(Product, (prev, next) => {
  const prevDocID = prev.doc.id;
  const nextDocID = next.doc.id;

  const prevSellerID = prev.selectedSeller?.id;
  const nextSellerID = next.selectedSeller?.id;

  if (prevDocID !== nextDocID) return false;
  if (prevSellerID !== nextSellerID) return false;

  return true;
});

export function Product({ doc, selectedSeller }: props) {
  const [outputsAmount, setOutputsAmount] = useState(0);
  const [amount, setAmount] = useState(0);
  const data = useMemo(() => doc.data(), [doc]);
  const currentStock = data.stock.reduce((acc, stock) => {
    return acc + stock.amount;
  }, 0);
  const selectedSellerData = useMemo(
    () => selectedSeller?.data(),
    [selectedSeller]
  );

  return (
    <ProductContainer
      $hide={false}
      $hasInventory={selectedSellerData?.hasInventory}
      $withoutStock={1}
      $after={`${currentStock} / ${data.stock.length}`}
    >
      <Column>
        <GrabButton>-</GrabButton>
      </Column>
      <Column gridColumn="2 / 5">{data.name}</Column>
      <Column>0</Column>
      <AddOutput
        productDoc={doc}
        currentStock={currentStock}
        stocks={data.stock}
        setOutputsAmount={setOutputsAmount}
      />
      <Column>
        <Input type="number" />
      </Column>
      <MemoProductSold
        outputsAmount={outputsAmount}
        inventoryAmount={0}
        devolutionAmount={0}
        setAmount={setAmount}
      />
    </ProductContainer>
  );
}
