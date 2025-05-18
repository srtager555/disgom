import { productDoc } from "@/tools/products/create";
import {
  DocumentSnapshot,
  onSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { ProductContainer } from "../../ProductList";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Column } from "../../Product";
import styled from "styled-components";
import { SellersDoc } from "@/tools/sellers/create";
import { AddOutput, rawOutput } from "./AddOutput";
import { ProductSold } from "./ProductSold";
import { Price } from "./Price";
import { isEqual, isPlainObject } from "lodash";
import { TotalSold } from "./TotalSold";
import { Commission } from "./Commission";
import { Profit } from "./Profit";
import { Fold } from "./fold";
import { Devolution } from "./Devolution";
import { inventory_output } from "@/tools/sellers/invetory/addProduct";
import { getInventoryByProduct } from "@/tools/invoices/getInventoryByProduct";
import { productResult } from "@/components/pages/invoice/ProductList";
import { numberParser } from "@/tools/numberPaser";
import { useInvoice } from "@/contexts/InvoiceContext";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";
import { getDefaultCustomPrice } from "@/tools/sellers/customPrice/getDefaultCustomPrice";
import { defaultCustomPrice } from "@/tools/sellers/customPrice/createDefaultCustomPrice";
import { stockType } from "@/tools/products/addToStock";

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
export type props = {
  doc: QueryDocumentSnapshot<productDoc>;
  selectedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  hideProductWithoutStock: boolean;
  allInventory: DocumentSnapshot<inventory_output>[];
  setProductsResults: React.Dispatch<
    React.SetStateAction<Record<string, productResult>>
  >;
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
  if (!isEqual(prev.allInventory, next.allInventory)) return false;

  return true;
});

export function Product({
  doc,
  selectedSeller,
  hideProductWithoutStock,
  allInventory,
  setProductsResults,
}: props) {
  const outputs = useGetProductOutputByID(doc.id);
  const { invoice } = useInvoice();
  const [defaultCustomPrice, setDefaultCustomPrice] = useState<
    DocumentSnapshot<defaultCustomPrice> | undefined
  >();
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [isFolded, setIsFolded] = useState(true);
  const [rtDoc, setRtDoc] = useState<DocumentSnapshot<productDoc>>(doc);
  const [warn, setWarn] = useState(false);
  const [remainStock, setRemainStock] = useState<rawOutput[]>([]);
  const [stockOverflowWarning, setStockOverflowWarning] = useState(false);
  const [stockFromParent, setStockFromParent] = useState<stockType[]>();
  const [remainStockTotals, setRemainStockTotals] = useState<productResult>({
    amount: 0,
    cost: 0,
    sold: 0,
    profit: 0,
    seller_sold: 0,
    seller_profit: 0,
  });
  const rtDocData = rtDoc.data();
  const inventory = useMemo(() => {
    return getInventoryByProduct(allInventory, doc.ref);
  }, [allInventory, doc.ref]);

  const currentStock = useMemo(() => {
    const data = rtDoc.data();
    if (!data) return 0;

    if (stockFromParent) {
      return stockFromParent.reduce((acc, stock) => {
        return acc + stock.amount;
      }, 0);
    }

    return data.stock.reduce((acc, stock) => {
      return acc + stock.amount;
    }, 0);
  }, [rtDoc, stockFromParent]);
  const selectedSellerData = useMemo(
    () => selectedSeller?.data(),
    [selectedSeller]
  );
  const someHumanChangesDetected = useRef<someHumanChangesDetected>({
    addOutput: false,
    devolution: false,
    price: false,
  });

  // effect to get the realtime parent to get him stock
  useEffect(() => {
    if (!rtDocData?.product_parent) return;

    const unsubcribe = onSnapshot(rtDocData?.product_parent, (snap) => {
      setStockFromParent(snap.data()?.stock);
    });

    return () => unsubcribe();
  }, [rtDoc]);

  // effect to get the real time data from the product
  useEffect(() => {
    const unsubcribe = onSnapshot(doc.ref, (snap) => {
      if (!isEqual(snap, rtDoc)) setRtDoc(snap);
    });

    return () => unsubcribe();
  }, [doc.ref]);

  useEffect(() => {
    const results = remainStock.reduce<productResult>(
      (acc, stock) => {
        const multiplicator =
          invoice?.data().invoice_type === "normal" ? 1 : -1;
        const amount = stock.amount;
        const cost = stock.purchase_price * amount * multiplicator;
        const sold = stock.sale_price * amount * multiplicator;
        const profit = sold - cost;
        const seller_profit = stock.commission * amount * multiplicator;
        const seller_sold = sold + seller_profit;

        return {
          amount: acc.amount + amount,
          cost: acc.cost + cost,
          sold: acc.sold + sold,
          profit: acc.profit + profit,
          seller_sold: acc.seller_sold + seller_sold,
          seller_profit: acc.seller_profit + seller_profit,
        };
      },
      {
        amount: 0,
        cost: 0,
        sold: 0,
        profit: 0,
        seller_sold: 0,
        seller_profit: 0,
      }
    );

    setRemainStockTotals(results);
    setProductsResults((prev) => ({
      ...prev,
      [doc.id]: results,
    }));
  }, [remainStock, doc.id, setProductsResults, invoice]);

  // effect to get the last defaultCustomPrice
  useEffect(() => {
    async function getDefaultCutomPriceFunctionBTW() {
      if (!selectedSeller) return setDefaultCustomPrice(undefined);

      const lastDefaultCustomPrice = await getDefaultCustomPrice(
        selectedSeller.ref,
        doc.ref,
        invoice?.data().client_ref
      );

      setDefaultCustomPrice(lastDefaultCustomPrice);
    }

    getDefaultCutomPriceFunctionBTW();
  }, [selectedSeller, doc.ref, invoice]);

  // useEffect(() => console.log("root remaingStock", remainStock), [remainStock]);

  if (hideProductWithoutStock && currentStock === 0) return <></>;

  return (
    <ProductContainer
      $hide={false}
      $hasInventory={selectedSellerData?.hasInventory}
      $withoutStock={currentStock || outputs.length}
      $fold={!isFolded}
      $warn={warn || stockOverflowWarning}
      $highlight={
        isPlainObject(invoice?.data().refresh_data)
          ? typeof (invoice?.data().refresh_data as Record<string, boolean>)[
              doc.id
            ] === "boolean"
          : false
      }
    >
      <Column title={numberParser(currentStock)}>
        {numberParser(currentStock)}
      </Column>
      <Column gridColumn="2 / 5">{rtDocData?.name}</Column>

      {/* ここから下は、src/components/pages/invoice/manage/products/Product.tsx のコード */}
      {selectedSellerData?.hasInventory && (
        <Column>{inventory.totalAmount}</Column>
      )}
      <AddOutput
        outputs={outputs}
        productDoc={rtDoc}
        customPrice={customPrice}
        currentStock={currentStock}
        someHumanChangesDetected={someHumanChangesDetected}
        setOverflowWarning={setStockOverflowWarning}
        defaultCustomPrices={defaultCustomPrice}
      />
      <Devolution
        productDoc={doc}
        sellerHasInventory={selectedSellerData?.hasInventory}
        setRemainStock={setRemainStock}
        customPrice={customPrice}
        seletedSeller={selectedSeller}
        someHumanChangesDetected={someHumanChangesDetected}
        inventory={inventory.outputs}
      />
      <ProductSold
        remainStock={remainStock}
        remainStockTotals={remainStockTotals}
        seletedSeller={selectedSeller}
        product_doc={doc}
        setWarn={setWarn}
        sellerHasInventory={selectedSellerData?.hasInventory}
        someHumanChangesDetected={someHumanChangesDetected}
      />
      <Price
        product_ref={doc.ref}
        defaultCustomPrice={defaultCustomPrice?.data()}
        normalPrice={rtDocData?.stock[0]?.sale_price || 0}
        outputs={outputs}
        setCustomPrice={setCustomPrice}
        someHumanChangesDetected={someHumanChangesDetected}
      />
      <TotalSold
        remainStockTotals={remainStockTotals}
        sellerHasInventory={selectedSellerData?.hasInventory}
      />
      <Commission
        remainStockTotals={remainStockTotals}
        sellerHasInventory={selectedSellerData?.hasInventory}
      />
      <Profit
        sellerHasInventory={selectedSellerData?.hasInventory}
        remainStockTotals={remainStockTotals}
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
