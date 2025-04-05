import { productDoc } from "@/tools/products/create";
import { onSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { ProductContainer } from "../../ProductList";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Column } from "../../Product";
import styled from "styled-components";
import { SellersDoc } from "@/tools/sellers/create";
import { AddOutput, rawOutput } from "./AddOutput";
import { ProductSold } from "./ProductSold";
import { Price } from "./Price";
import { isEqual } from "lodash";
import { TotalSold } from "./TotalSold";
import { Commission } from "./Commission";
import { Profit } from "./Profit";
import { Fold } from "./fold";
import { Devolution } from "./Devolution";

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

export type someHumanChangesDetected = {
  addOutput: boolean;
  devolution: boolean;
  price: boolean;
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
  const [devolutionAmount, setDevolutionAmount] = useState(0);
  const [amount, setAmount] = useState<undefined | number>(undefined);
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [isFolded, setIsFolded] = useState(true);
  const [rtDocData, setRtDocData] = useState<productDoc>(doc.data());
  const [warn, setWarn] = useState(false);
  const [remainStock, setRemainStock] = useState<rawOutput[]>([]);
  const currentStock = rtDocData.stock.reduce((acc, stock) => {
    return acc + stock.amount;
  }, 0);
  const selectedSellerData = useMemo(
    () => selectedSeller?.data(),
    [selectedSeller]
  );
  const someHumanChangesDetected = useRef<someHumanChangesDetected>({
    addOutput: false,
    devolution: false,
    price: false,
  });

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
      $warn={warn}
    >
      <Column>
        <GrabButton>-</GrabButton>
      </Column>
      <Column gridColumn="2 / 5">{rtDocData.name}</Column>

      {/* ここから下は、src/components/pages/invoice/manage/products/Product.tsx のコード */}
      {selectedSellerData?.hasInventory && <Column>0</Column>}
      <AddOutput
        productDoc={doc}
        customPrice={customPrice}
        currentStock={currentStock}
        setOutputsAmount={setOutputsAmount}
        someHumanChangesDetected={someHumanChangesDetected}
      />
      <Devolution
        setDevolutionAmount={setDevolutionAmount}
        productDoc={doc}
        sellerHasInventory={selectedSellerData?.hasInventory}
        setRemainStock={setRemainStock}
        customPrice={customPrice}
        seletedSeller={selectedSeller}
        someHumanChangesDetected={someHumanChangesDetected}
      />
      <ProductSold
        remainStock={remainStock}
        seletedSeller={selectedSeller}
        product_doc={doc}
        customPrice={customPrice}
        outputsAmount={outputsAmount}
        inventoryAmount={0}
        devolutionAmount={devolutionAmount}
        setAmount={setAmount}
        setWarn={setWarn}
        sellerHasInventory={selectedSellerData?.hasInventory}
        someHumanChangesDetected={someHumanChangesDetected}
      />
      <Price
        product_id={doc.id}
        normalPrice={rtDocData.stock[0]?.sale_price || 0}
        setCustomPrice={setCustomPrice}
        someHumanChangesDetected={someHumanChangesDetected}
      />
      <TotalSold
        amount={amount}
        customPrice={customPrice}
        normalPrice={rtDocData.stock[0]?.sale_price}
        sellerHasInventory={selectedSellerData?.hasInventory}
      />
      <Commission
        amount={amount}
        commission={rtDocData.stock[0]?.seller_commission}
        sellerHasInventory={selectedSellerData?.hasInventory}
      />
      <Profit
        sellerHasInventory={selectedSellerData?.hasInventory}
        remainStock={remainStock}
      />
      <Fold
        isFolded={isFolded}
        setIsFolded={setIsFolded}
        selectedSellerData={selectedSellerData}
        product_ref={doc.ref}
      />
    </ProductContainer>
  );
}
