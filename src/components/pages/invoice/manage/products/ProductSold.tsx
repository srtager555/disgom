import { numberParser } from "@/tools/numberPaser";
import { Column } from "../../Product";
import { Dispatch, memo, RefObject, SetStateAction, useEffect } from "react";
import { addOutputs, outputType } from "@/tools/products/addOutputs";
import {
  collection,
  CollectionReference,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { isEqual } from "lodash";
import { useGetInvoiceByQuery } from "@/hooks/invoice/getInvoiceByQuery";
import { SellersDoc } from "@/tools/sellers/create";
import { rawOutput } from "./AddOutput";
import { someHumanChangesDetected } from "./Product";
import { productResult } from "@/components/pages/invoice/ProductList";

type props = {
  product_doc: QueryDocumentSnapshot<productDoc>;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
  remainStock: rawOutput[];
  remainStockTotals: productResult;
  setWarn: Dispatch<SetStateAction<boolean>>;
  sellerHasInventory: boolean | undefined;
  seletedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
};

export const ProductSold = (props: Omit<props, "outputs">) => {
  return <MemoProductSold {...props} />;
};

export const MemoProductSold = memo(ProductSoldBase, (prev, next) => {
  if (prev.sellerHasInventory != next.sellerHasInventory) return false;
  if (!isEqual(prev.product_doc.id, next.product_doc.id)) return false;
  if (!isEqual(prev.remainStock, next.remainStock)) return false;
  if (!isEqual(prev.remainStockTotals, next.remainStockTotals)) return false;

  return true;
});

export function ProductSoldBase({
  remainStock,
  product_doc,
  remainStockTotals,
  setWarn,
  sellerHasInventory,
  someHumanChangesDetected,
}: props) {
  const invoiceDoc = useGetInvoiceByQuery();

  useEffect(() => {
    setWarn(remainStockTotals.amount < 0);
  }, [remainStockTotals.amount, setWarn]);

  useEffect(() => {
    async function saveOutputsSolds() {
      const isHumanChanges = Object.values(
        someHumanChangesDetected.current
      ).some((v) => v);

      if (!invoiceDoc) return;
      if (!isHumanChanges) return;

      console.log("save outputs solds");

      const coll = collection(
        invoiceDoc.ref,
        "outputs_sold"
      ) as CollectionReference<outputType>;

      // outputs totalSold
      await addOutputs(
        invoiceDoc,
        product_doc,
        remainStock,
        "outputs_sold",
        coll
      );

      someHumanChangesDetected.current = {
        addOutput: false,
        devolution: false,
        price: false,
      };
    }

    saveOutputsSolds();
  }, [remainStock]);

  if (sellerHasInventory)
    return <Column>{numberParser(remainStockTotals.amount)}</Column>;
}
