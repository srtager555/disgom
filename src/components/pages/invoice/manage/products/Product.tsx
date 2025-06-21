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
import { useGetCurrentDevolutionByProduct } from "@/hooks/invoice/getCurrentDevolution";
import {
  amountListener,
  createStockFromOutputType,
  rawOutputToStock,
} from "@/tools/products/ManageSaves";
import { ProductOutputsProvider } from "@/contexts/ProductOutputsContext";
import { outputType } from "@/tools/products/addOutputs";
import { updatePrice } from "@/tools/products/updatePrice";

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
  const { outputs: currentDevolutionOutputs } =
    useGetCurrentDevolutionByProduct(doc.id);
  const currentServerDevolution =
    currentDevolutionOutputs?.reduce((acc, el) => acc + el.data().amount, 0) ||
    0;
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
  const [rawOutputs, setRawOutputs] = useState<rawOutput[]>([]);
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
  const defaultPriceData = useMemo(() => {
    return defaultCustomPrice?.data();
  }, [defaultCustomPrice]);

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

  // Effect to initialize and sync remainStock based on rawOutputs and devolutions
  useEffect(() => {
    // This effect ensures that remainStock is always correctly calculated
    // based on the total sold items (rawOutputs) minus the current server devolution.

    // 1. Combine all sources of stock for this product in this invoice context.
    // This includes items sold (rawOutputs) and any pre-existing devolution inventory.
    const soldStocks = rawOutputs.map((raw) => rawOutputToStock(raw));
    const inventoryStocks = inventory.outputs.map((invDoc) =>
      createStockFromOutputType(invDoc.data() as outputType)
    );
    // Combine and remove duplicates if any (though unlikely with this logic).
    const combinedStocks = [...soldStocks, ...inventoryStocks];

    // 2. Use amountListener to "return" the devolved amount from the sold stock.
    // The `remainingStocks` will be what's truly left after the devolution.
    const { remainingStocks } = amountListener(
      currentServerDevolution,
      combinedStocks,
      undefined, // defaultCustomPrices not needed for this calculation
      doc,
      undefined // customPrice not needed for this calculation
    );

    // 3. Update the remainStock state.
    // This will run on initial load and whenever rawOutputs or currentServerDevolution changes.
    if (!isEqual(remainingStocks, remainStock)) {
      setRemainStock(remainingStocks);
    }
  }, [rawOutputs, currentServerDevolution, doc, inventory.outputs]); // Dependencies: sold items, returned items, and initial inventory.
  // `remainStock` is not in dependencies to avoid loops.

  // Effect to handle price updates
  useEffect(() => {
    // This effect is triggered when the customPrice state changes.
    // It's responsible for updating the rawOutputs with the new price,
    // which in turn updates remainStock and the totals.

    // We use a ref to track if this is the initial render to avoid running on mount.
    // The `someHumanChangesDetected` flag ensures we only run this after a user action.
    if (!someHumanChangesDetected.current.price || !invoice) {
      return;
    }

    console.log(
      `Product: Detected price change to ${customPrice}. Triggering update.`
    );

    // The amount to use is the current total from rawOutputs
    const currentAmount = rawOutputs.reduce((acc, o) => acc + o.amount, 0);

    // If there's nothing to update the price on, do nothing.
    if (currentAmount === 0) return;

    // Call the updatePrice tool function. It will update the rawOutputs for immediate UI feedback
    // and debounce the actual save to Firestore.
    // Note: updatePrice returns a cancel function, but we don't need to manage it here
    // because each new price change will trigger a new debounced save, implicitly cancelling the old one.
    updatePrice(
      invoice,
      doc,
      defaultCustomPrice,
      outputs, // The original server outputs
      currentAmount,
      stockFromParent || [],
      setRawOutputs, // Pass the setter to update UI
      customPrice
    );
  }, [customPrice]); // This effect runs only when customPrice changes.

  // effect to get the real time data from the product
  useEffect(() => {
    const unsubcribe = onSnapshot(doc.ref, (snap) => {
      if (!isEqual(snap, rtDoc)) setRtDoc(snap);
    });

    return () => unsubcribe();
  }, [doc.ref]);

  // effect to calculate the invoice result
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

      if ("SvlOP05N8Ovk7w6hfcGJ" === doc.id)
        console.log("lastDefaultCustomPrice", lastDefaultCustomPrice);

      setDefaultCustomPrice(lastDefaultCustomPrice);
    }

    getDefaultCutomPriceFunctionBTW();

    return () => {
      setDefaultCustomPrice(undefined);
    };
  }, [selectedSeller, doc.id]);

  if (hideProductWithoutStock && currentStock === 0) return <></>;

  return (
    <ProductOutputsProvider productDocId={doc.id}>
      <ProductContainer
        $hide={false}
        $hasInventory={selectedSellerData?.hasInventory}
        $withoutStock={currentStock || outputs.length}
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
          productDoc={rtDoc}
          customPrice={customPrice}
          currentStock={currentStock}
          someHumanChangesDetected={someHumanChangesDetected}
          setOverflowWarning={setStockOverflowWarning}
          defaultCustomPrices={defaultCustomPrice}
          rawOutputs={rawOutputs}
          setRawOutputs={setRawOutputs}
          parentStock={stockFromParent || []}
        />
        <Devolution
          productDoc={doc}
          sellerHasInventory={selectedSellerData?.hasInventory}
          setRemainStock={setRemainStock}
          customPrice={customPrice}
          seletedSeller={selectedSeller}
          someHumanChangesDetected={someHumanChangesDetected}
          inventory={inventory.outputs}
          rawOutputs={rawOutputs}
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
          sellerHasInventory={selectedSellerData?.hasInventory}
          product_doc={doc}
          product_ref={doc.ref}
          defaultCustomPrice={defaultPriceData?.price}
          // normalPrice={rtDocData?.stock[0]?.sale_price || 0}
          outputs={outputs}
          setCustomPrice={setCustomPrice}
          someHumanChangesDetected={someHumanChangesDetected}
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
    </ProductOutputsProvider>
  );
}
