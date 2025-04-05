import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  query,
  collection,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { invoiceType } from "../invoices/createInvoice";
import { SellersDoc } from "../sellers/create";
import {
  addInventoryProduct,
  inventory_output,
} from "../sellers/invetory/addProduct";
import { createInventory } from "../sellers/invetory/create";
import { outputType } from "./addOutputs";
import { createStockFromOutputType, amountListener } from "./ManageSaves";
import { productDoc } from "./create";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { Dispatch, RefObject, SetStateAction } from "react";

export async function saveDevolution(
  invoiceDoc: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  seletedSeller: DocumentSnapshot<SellersDoc>,
  inventory_outputs: DocumentSnapshot<outputType>[],
  outputs: DocumentSnapshot<outputType>[],
  devoDebounce: number,
  customPrice: number | undefined,
  setRemainStock: Dispatch<SetStateAction<rawOutput[]>>,
  humanAmountChanged: RefObject<boolean>,
  currentDevolution: number
) {
  const allOutputs = [...inventory_outputs, ...[...outputs].reverse()];
  const stock = allOutputs.map((el) =>
    createStockFromOutputType(el.data() as outputType)
  );

  const outputsWorked = amountListener(
    devoDebounce as number,
    stock,
    productDoc as QueryDocumentSnapshot<productDoc>,
    customPrice
  );

  // save sold product
  setRemainStock(outputsWorked.remainingStocks);

  // check if a human make the changes
  if (!humanAmountChanged.current) {
    console.log("Human change not detected, saving cancelated");
    return;
  }
  console.log("Human change detected, saving devolution");

  // check if the current devo is the same in the input
  if (devoDebounce === currentDevolution) {
    console.log(
      "devoDebounce is the same as currentDevolution, saving cancelated",
      devoDebounce,
      currentDevolution
    );
    return;
  }

  humanAmountChanged.current = false;

  let inventoryRef = invoiceDoc.data()?.devolution;
  if (!inventoryRef) {
    inventoryRef = await createInventory(invoiceDoc.ref, seletedSeller?.ref);
  }

  const q = query(
    collection(inventoryRef, "products"),
    where("product_ref", "==", productDoc.ref)
  );

  const oldDevo = await getDocs(q);
  if (oldDevo.size > 0) {
    console.log("disable old devolution");

    oldDevo.forEach(async (el) => {
      await updateDoc(el.ref, {
        disabled: true,
      });
    });
  }

  const newInventory = outputsWorked.outputsToCreate.map(
    async (el) =>
      await addInventoryProduct(inventoryRef, {
        ...el,
        inventory_ref: inventoryRef,
        disabled: false,
      } as inventory_output)
  );

  await Promise.all(newInventory);

  await updateDoc(invoiceDoc.ref, {
    devolution: inventoryRef,
  });

  console.log("devo saved");
}
