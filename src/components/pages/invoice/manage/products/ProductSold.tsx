import { numberParser } from "@/tools/numberPaser";
import { Column } from "../../Product";
import { Dispatch, memo, SetStateAction, useEffect, useState } from "react";
import { addOutputs, outputType } from "@/tools/products/addOutputs";
import {
  collection,
  CollectionReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { isEqual } from "lodash";
import { useGetInvoiceByQuery } from "@/hooks/invoice/getInvoiceByQuery";
import { SellersDoc } from "@/tools/sellers/create";
import { rawOutput } from "./AddOutput";

type props = {
  product_doc: QueryDocumentSnapshot<productDoc>;
  someHumanChangesDetected: {
    addOutput: boolean;
    devolution: boolean;
    price: boolean;
  };
  setSomeHumanChangesDetected: Dispatch<
    SetStateAction<{
      addOutput: boolean;
      devolution: boolean;
      price: boolean;
    }>
  >;
  customPrice: number | undefined;
  remainStock: rawOutput[];
  outputsAmount: number;
  inventoryAmount: number;
  devolutionAmount: number;
  setAmount: Dispatch<SetStateAction<number | undefined>>;
  setWarn: Dispatch<SetStateAction<boolean>>;
  sellerHasInventory: boolean | undefined;
  seletedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
};

export const ProductSold = (props: Omit<props, "outputs">) => {
  // const outputs = useGetProductOutputByID(props.product_doc.id);

  return (
    <MemoProductSold
      {...props}
      // outputs={outputs}
    />
  );
};

export const MemoProductSold = memo(ProductSoldBase, (prev, next) => {
  if (prev.outputsAmount != next.outputsAmount) return false;
  if (prev.devolutionAmount != next.devolutionAmount) return false;
  if (prev.inventoryAmount != next.inventoryAmount) return false;
  if (prev.sellerHasInventory != next.sellerHasInventory) return false;
  if (!isEqual(prev.product_doc.id, next.product_doc.id)) return false;
  if (prev.customPrice != next.customPrice) return false;
  if (!isEqual(prev.remainStock, next.remainStock)) return false;

  return true;
});

export function ProductSoldBase({
  customPrice,
  remainStock,
  product_doc,
  outputsAmount,
  inventoryAmount,
  devolutionAmount,
  setAmount,
  setWarn,
  sellerHasInventory,
  someHumanChangesDetected,
  setSomeHumanChangesDetected,
}: props) {
  const [total, setTotal] = useState(0);
  const inventory_outputs = [] as DocumentSnapshot<outputType>[];
  const invoiceDoc = useGetInvoiceByQuery();

  useEffect(() => {
    const total = outputsAmount + inventoryAmount - devolutionAmount;

    setWarn(total < 0);

    setTotal(total);
    setAmount(total);
  }, [devolutionAmount, inventoryAmount, outputsAmount, setAmount, setWarn]);

  useEffect(() => {
    async function saveOutputsSolds() {
      if (!invoiceDoc) return;
      if (Object.values(someHumanChangesDetected).every((v) => !v)) return;

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

      setSomeHumanChangesDetected({
        addOutput: false,
        devolution: false,
        price: false,
      });
    }

    saveOutputsSolds();
  }, [
    inventory_outputs,
    customPrice,
    total,
    someHumanChangesDetected,
    invoiceDoc,
    product_doc,
    remainStock,
    setSomeHumanChangesDetected,
  ]);

  if (sellerHasInventory) return <Column>{numberParser(total)}</Column>;
}
