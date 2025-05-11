import { numberParser } from "@/tools/numberPaser";
import { Column } from "../../Product";
import { Dispatch, memo, RefObject, SetStateAction, useEffect } from "react";
import { addOutputs, outputType } from "@/tools/products/addOutputs";
import {
  collection,
  CollectionReference,
  getDocs,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { isEqual, isPlainObject } from "lodash";
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

      let refresh_data;
      if (isPlainObject(invoiceDoc?.data()?.refresh_data))
        refresh_data = invoiceDoc?.data()?.refresh_data as Record<
          string,
          boolean
        >;
      else refresh_data = {};

      if (!invoiceDoc) return;

      if (refresh_data[product_doc.id])
        if (!isHumanChanges) {
          console.log("skip");
          return;
        }

      console.log("save outputs solds");

      const coll = collection(
        invoiceDoc.ref,
        "outputs_sold"
      ) as CollectionReference<outputType>;

      // disable the current outputs sold
      const q = query(coll, where("disabled", "==", false));
      const outputs_sold = await getDocs(q);

      if (outputs_sold.size > 0) {
        outputs_sold.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            disabled: true,
          });
        });
      }

      // outputs totalSold
      await addOutputs(invoiceDoc, product_doc, remainStock, coll);

      // update the refresh data
      await updateDoc(invoiceDoc.ref, {
        [`refresh_data.${product_doc.id}`]: true,
      });

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
