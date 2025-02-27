import { productDoc } from "@/tools/products/create";
import {
  DocumentSnapshot,
  onSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { ProductContainer } from "../../ProductList";
import { memo, useEffect, useMemo, useState } from "react";
import { Column, Input } from "../../Product";
import styled from "styled-components";
import { SellersDoc } from "@/tools/sellers/create";
import { AddOutput } from "./AddOutput";
import { MemoProductSold } from "./ProductSold";
import { Price } from "./Price";
import { isEqual } from "lodash";
import { TotalSold } from "./TotalSold";
import { Commission } from "./Commission";
import { Profit } from "./Profit";
import { Fold } from "./fold";

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
  hideProductWithoutStock: boolean;
};

export const MemoProduct = memo(Product, (prev, next) => {
  const prevDocID = prev.doc.id;
  const nextDocID = next.doc.id;

  const prevSellerID = prev.selectedSeller?.id;
  const nextSellerID = next.selectedSeller?.id;

  if (prev.hideProductWithoutStock !== next.hideProductWithoutStock)
    return false;
  if (prevDocID !== nextDocID) return false;
  if (prevSellerID !== nextSellerID) return false;

  return true;
});

export function Product({
  doc,
  selectedSeller,
  hideProductWithoutStock,
}: props) {
  const [outputsAmount, setOutputsAmount] = useState(0);
  const [amount, setAmount] = useState(0);
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [price, setPrice] = useState(0);
  const [isFolded, setIsFolded] = useState(true);
  const [rtDocData, setRtDocData] = useState<productDoc>(doc.data());
  const currentStock = rtDocData.stock.reduce((acc, stock) => {
    return acc + stock.amount;
  }, 0);
  const selectedSellerData = useMemo(
    () => selectedSeller?.data(),
    [selectedSeller]
  );

  // effect to get the real time data from the product
  useEffect(() => {
    const unsubcribe = onSnapshot(doc.ref, (snap) => {
      const newData = snap.data();

      if (!isEqual(newData, rtDocData))
        setRtDocData(snap.data() as unknown as productDoc);
    });

    return () => unsubcribe();
  }, [doc.ref]);

  if (hideProductWithoutStock && currentStock === 0) return <></>;
  return (
    <ProductContainer
      $hide={false}
      $hasInventory={selectedSellerData?.hasInventory}
      $withoutStock={currentStock}
      $after={`${currentStock} / ${rtDocData.stock.length}`}
      $fold={!isFolded}
    >
      <Column>
        <GrabButton>-</GrabButton>
      </Column>
      <Column gridColumn="2 / 5">{rtDocData.name}</Column>
      <Column>0</Column>
      <AddOutput
        productDoc={doc}
        // rtProductData={rtDocData}
        currentStock={currentStock}
        stocks={rtDocData.stock}
        setOutputsAmount={setOutputsAmount}
        customPrice={customPrice}
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
      <Price
        normalPrice={rtDocData.stock[0]?.sale_price || 0}
        setCustomPrice={setCustomPrice}
        customPrice={customPrice}
      />
      <TotalSold
        amount={amount}
        customPrice={customPrice}
        normalPrice={rtDocData.stock[0]?.sale_price}
      />
      <Commission
        amount={amount}
        commission={rtDocData.stock[0]?.seller_commission}
      />
      <Profit id={doc.id} />
      <Fold
        isFolded={isFolded}
        setIsFolded={setIsFolded}
        selectedSellerData={selectedSellerData}
        product_id={doc.id}
      />
    </ProductContainer>
  );
}
