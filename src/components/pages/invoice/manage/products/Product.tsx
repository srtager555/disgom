import { productDoc } from "@/tools/products/create";
import {
  DocumentSnapshot,
  onSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { ProductContainer } from "../../ProductList";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Column } from "../../Product";

import { SellersDoc } from "@/tools/sellers/create";
import { AddOutput } from "./AddOutput";
import { ProductSold } from "./ProductSold";
import { Price } from "./Price";
import { isEqual, isPlainObject } from "lodash";
import { TotalSold } from "./TotalSold";
import { Commission } from "./Commission";
import { Profit } from "./Profit";
import { Fold } from "./fold";
import { Devolution } from "./Devolution";
import { getInventoryByProduct } from "@/tools/invoices/getInventoryByProduct";
import { productResult } from "@/components/pages/invoice/ProductList";
import { numberParser } from "@/tools/numberPaser";
import { useInvoice } from "@/contexts/InvoiceContext";
import { getDefaultCustomPrice } from "@/tools/sellers/customPrice/getDefaultCustomPrice";
import { defaultCustomPrice } from "@/tools/sellers/customPrice/createDefaultCustomPrice";
import { ProductOutputsProvider } from "@/contexts/ProductOutputsContext";
import { useManageOutputs } from "@/hooks/invoice/useManageOutputs";
import { useManageDevolutions } from "@/hooks/invoice/useManageDevolutions";
import { useCalculateProductTotals } from "@/hooks/invoice/useCalculateProductTotals";
import { outputType } from "@/tools/products/addOutputs";
import { useApplyPriceToStock } from "@/hooks/invoice/useApplyPriceToStock";
import { useManagePrice } from "@/hooks/invoice/useManagePrice";

// サラマンダー
export type props = {
  doc: QueryDocumentSnapshot<productDoc>;
  selectedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  hideProductWithoutStock: boolean;
  allInventory: DocumentSnapshot<outputType>[];
  setProductsResults: React.Dispatch<
    React.SetStateAction<Record<string, productResult>>
  >;
};

export type someHumanChangesDetected = {
  addOutput: boolean;
  devolution: boolean;
  price: boolean;
  outputsSolds: boolean;
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

export function BaseProduct({
  doc,
  selectedSeller,
  hideProductWithoutStock,
  allInventory,
  setProductsResults,
}: props) {
  const { invoice } = useInvoice();
  const [defaultCustomPrice, setDefaultCustomPrice] = useState<
    QueryDocumentSnapshot<defaultCustomPrice> | undefined
  >();
  const [isFolded, setIsFolded] = useState(true);
  const [rtDoc, setRtDoc] = useState<DocumentSnapshot<productDoc>>(doc);
  const [warn, setWarn] = useState(false);
  const [stockOverflowWarning, setStockOverflowWarning] = useState(false);
  const [parentProduct, setParentProduct] =
    useState<DocumentSnapshot<productDoc>>();

  // --- State for Inputs ---
  const [amountInput, setAmountInput] = useState<string>("0");

  // --- Ref for Human Interaction ---
  const someHumanChangesDetected = useRef<someHumanChangesDetected>({
    addOutput: false,
    devolution: false,
    price: false,
    outputsSolds: false,
  });
  const defaultPriceData = useMemo(() => {
    return defaultCustomPrice?.data();
  }, [defaultCustomPrice]);

  // --- Custom Hooks for Core Logic ---
  const {
    isPriceLoading,
    customPrice,
    priceValue,
    normalPrice,
    priceMultiplier,
    isDefaultCustomPrice,
    handlePriceChange,
    handlePriceBlur,
  } = useManagePrice({
    product_doc: doc,
    product_ref: doc.ref,
    defaultCustomPrice: defaultPriceData?.price,
    someHumanChangesDetected,
  });
  const {
    rawOutputs,
    currentOutputsServerAmount,
    setRunOnBlurEventAgain: setRunAddOutputsOnBlurAgain,
    runOnBlurEventAgain: runAddOuputsOnBlurAgain,
  } = useManageOutputs({
    invoice,
    productDoc: rtDoc,
    defaultCustomPrices: defaultCustomPrice,
    productParent: parentProduct,
    amountInput,
    customPriceInput: customPrice,
    humanInteractionDetectedRef: someHumanChangesDetected,
  });
  const {
    remainStock: devoRemainStock,
    setLocalDevoInput: setDevoInput,
    localDevoInput: devoInput,
    runAgainOnBlurEvent: runDevoOnBlurEvent,
    setRunAgainOnBlurEvent: setRunDevoOnBlurEvent,
  } = useManageDevolutions({
    invoice,
    productDoc: rtDoc,
    seletedSeller: selectedSeller,
    inventoryOutputs: getInventoryByProduct(allInventory, doc.ref).outputs,
    rawOutputs,
    customPriceInput: customPrice,
    humanInteractionDetectedRef: someHumanChangesDetected,
  });
  const { remainStock } = useApplyPriceToStock({
    customPriceInput: customPrice,
    devoRemainStock,
    humanInteractionDetectedRef: someHumanChangesDetected,
    isLoadingPrice: isPriceLoading,
    productDoc: doc,
  });
  const remainStockTotals = useCalculateProductTotals(remainStock);

  // --- Memos for derived data ---
  const rtDocData = rtDoc.data();
  const inventory = useMemo(() => {
    return getInventoryByProduct(allInventory, doc.ref);
  }, [allInventory, doc.ref]);

  const currentStock = useMemo(() => {
    const data = rtDoc.data();
    if (!data) return 0;

    if (parentProduct) {
      return (
        parentProduct.data()?.stock.reduce((acc, stock) => {
          return acc + stock.amount;
        }, 0) || 0
      );
    }

    return data.stock.reduce((acc, stock) => {
      return acc + stock.amount;
    }, 0);
  }, [rtDoc, parentProduct]);
  const selectedSellerData = useMemo(
    () => selectedSeller?.data(),
    [selectedSeller]
  );

  // effect to get the realtime parent to get him stock
  useEffect(() => {
    if (!rtDocData?.product_parent) return;

    const unsubcribe = onSnapshot(rtDocData?.product_parent, (snap) => {
      setParentProduct(snap);
    });

    return () => unsubcribe();
  }, [rtDoc]);

  // effect to get the real time data from the product
  useEffect(() => {
    const unsubcribe = onSnapshot(doc.ref, (snap) => {
      if (!isEqual(snap, rtDoc)) setRtDoc(snap);
    });

    return () => unsubcribe();
  }, [doc.ref.id]);

  // Effect to update the parent component with the calculated totals
  useEffect(() => {
    setProductsResults((prev) => ({
      ...prev,
      [doc.id]: remainStockTotals,
    }));
  }, [remainStockTotals, doc.id, setProductsResults]);

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

    return () => {
      setDefaultCustomPrice(undefined);
    };
  }, [selectedSeller, doc.id]);

  if (hideProductWithoutStock && currentStock === 0 && rawOutputs.length === 0)
    return <></>;

  return (
    <ProductContainer
      $hide={false}
      $hasInventory={selectedSellerData?.hasInventory}
      $withoutStock={currentStock || rawOutputs.length}
      $fold={!isFolded}
      className={warn || stockOverflowWarning ? "alert" : ""}
      $highlight={
        isPlainObject(invoice?.data().refresh_data)
          ? typeof (invoice?.data().refresh_data as Record<string, boolean>)[
              doc.id
            ] === "boolean"
          : false
      }
    >
      <Column title={numberParser(currentStock)} className="hide-print">
        {numberParser(currentStock)}
      </Column>

      <Column
        gridColumn="2 / 5"
        printGridColumn={
          selectedSeller?.data()?.hasInventory ? "1 / 5" : "1 / 7"
        }
      >
        {rtDocData?.name}
      </Column>

      {/* ここから下は、src/components/pages/invoice/manage/products/Product.tsx のコード */}
      {selectedSellerData?.hasInventory && (
        <Column $textAlign="center">
          {numberParser(inventory.totalAmount)}
        </Column>
      )}
      <AddOutput
        amountInput={amountInput}
        devoInput={devoInput}
        setAmountInput={setAmountInput}
        invAmount={inventory.totalAmount}
        productDoc={rtDoc}
        currentStock={currentStock}
        someHumanChangesDetected={someHumanChangesDetected}
        setOverflowWarning={setStockOverflowWarning}
        currentServerAmount={currentOutputsServerAmount}
        runOnBlurEventAgain={runAddOuputsOnBlurAgain}
        setRunOnBlurEventAgain={setRunAddOutputsOnBlurAgain}
      />
      <Devolution
        rawOutputs={rawOutputs}
        inventoryAmount={inventory.totalAmount}
        setOverflowWarning={setStockOverflowWarning}
        setDevoInput={setDevoInput}
        productDoc={rtDoc}
        sellerHasInventory={selectedSellerData?.hasInventory}
        someHumanChangesDetected={someHumanChangesDetected}
        devoInput={devoInput}
        runOnBlurEventAgain={runDevoOnBlurEvent}
        setRunAgainOnBlurEvent={setRunDevoOnBlurEvent}
      />
      <ProductSold
        amount={Number(amountInput)}
        devoAmount={Number(devoInput)}
        invOutputs={inventory.outputs}
        remainStock={remainStock}
        remainStockTotals={remainStockTotals}
        seletedSeller={selectedSeller}
        product_doc={doc}
        setWarn={setWarn}
        sellerHasInventory={selectedSellerData?.hasInventory}
        someHumanChangesDetected={someHumanChangesDetected}
      />
      <Price
        sellerHasInventory={selectedSellerData?.hasInventory}
        priceValue={priceValue}
        normalPrice={normalPrice}
        priceMultiplier={priceMultiplier}
        isDefaultCustomPrice={isDefaultCustomPrice}
        handlePriceChange={handlePriceChange}
        handlePriceBlur={handlePriceBlur}
      />
      <TotalSold
        remainStockTotals={remainStockTotals}
        sellerHasInventory={selectedSellerData?.hasInventory}
      />
      <Profit
        sellerHasInventory={selectedSellerData?.hasInventory}
        remainStockTotals={remainStockTotals}
      />
      <Commission
        remainStockTotals={remainStockTotals}
        sellerHasInventory={selectedSellerData?.hasInventory}
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

export function Product(props: props) {
  return (
    <ProductOutputsProvider productDocId={props.doc.id}>
      <BaseProduct {...props} />
    </ProductOutputsProvider>
  );
}
