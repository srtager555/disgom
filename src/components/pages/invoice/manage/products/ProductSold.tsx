import { numberParser } from "@/tools/numberPaser";
import { Column } from "../../Product";
import { Dispatch, memo, SetStateAction, useEffect, useState } from "react";
import {
  amountListener,
  createStockFromOutputType,
} from "@/tools/products/ManageSaves";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";
import { addOutputs, outputType } from "@/tools/products/addOutputs";
import {
  collection,
  CollectionReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  updateDoc,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { isEqual } from "lodash";
import { useGetInvoiceByQuery } from "@/hooks/invoice/getInvoiceByQuery";
import {
  addInventoryProduct,
  inventory_output,
} from "@/tools/sellers/invetory/addProduct";
import { createInventory } from "@/tools/sellers/invetory/create";
import { SellersDoc } from "@/tools/sellers/create";

type props = {
  product_doc: QueryDocumentSnapshot<productDoc>;
  outputs: DocumentSnapshot<outputType>[];
  customPrice: number | undefined;
  humanAmountChanged: boolean;
  outputsAmount: number;
  inventoryAmount: number;
  devolutionAmount: number;
  setAmount: Dispatch<SetStateAction<number | undefined>>;
  setWarn: Dispatch<SetStateAction<boolean>>;
  sellerHasInventory: boolean | undefined;
  seletedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
};

export const ProductSold = (props: Omit<props, "outputs">) => {
  const outputs = useGetProductOutputByID(props.product_doc.id);

  return <MemoProductSold {...props} outputs={outputs} />;
};

export const MemoProductSold = memo(ProductSoldBase, (prev, next) => {
  if (prev.outputsAmount != next.outputsAmount) return false;
  if (prev.devolutionAmount != next.devolutionAmount) return false;
  if (prev.inventoryAmount != next.inventoryAmount) return false;
  if (prev.sellerHasInventory != next.sellerHasInventory) return false;
  if (!isEqual(prev.product_doc.id, next.product_doc.id)) return false;
  if (prev.customPrice != next.customPrice) return false;
  if (prev.humanAmountChanged != next.humanAmountChanged) return false;
  if (!isEqual(prev.outputs, next.outputs)) return false;

  return true;
});

export function ProductSoldBase({
  outputs = [],
  customPrice,
  product_doc,
  outputsAmount,
  inventoryAmount,
  devolutionAmount,
  setAmount,
  setWarn,
  sellerHasInventory,
  seletedSeller,
  humanAmountChanged,
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
      if (!humanAmountChanged) return;

      const allOutputs = outputs.concat(inventory_outputs);

      const stock = allOutputs.map((el) =>
        createStockFromOutputType(el.data() as outputType)
      );

      const outputsWorked = amountListener(
        total,
        stock,
        product_doc,
        customPrice
      );

      const coll = collection(
        invoiceDoc.ref,
        "outputs_sold"
      ) as CollectionReference<outputType>;
      // outputs totalSold
      const xxx = await addOutputs(
        invoiceDoc,
        product_doc,
        outputsWorked.outputsToCreate,
        "outputs_sold",
        coll
        // true
      );

      if (!seletedSeller) return;

      const inventoryRef = await createInventory(
        invoiceDoc.ref,
        seletedSeller?.ref
      );

      const newInventory = outputsWorked.remainingStocks.map(
        async (el) =>
          await addInventoryProduct(inventoryRef, {
            ...el,
            inventory_ref: inventoryRef,
          } as inventory_output)
      );

      await Promise.all(newInventory);

      await updateDoc(invoiceDoc.ref, {
        devolution: {
          amount: devolutionAmount,
          inventory_ref: inventoryRef,
        },
      });
      console.log(xxx);
    }

    saveOutputsSolds();
  }, [
    // outputs,
    inventory_outputs,
    // product_doc,
    customPrice,
    total,
    // invoiceDoc,
    humanAmountChanged,
  ]);

  if (sellerHasInventory) return <Column>{numberParser(total)}</Column>;
}
