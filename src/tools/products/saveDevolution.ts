import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  query,
  collection,
  where,
  getDocs,
  updateDoc,
  orderBy,
  limit,
  DocumentReference,
  CollectionReference,
} from "firebase/firestore";
import { invoiceType } from "../invoices/createInvoice";
import { SellersDoc } from "../sellers/create";
import {
  addInventoryProduct,
  inventory_output,
} from "../sellers/invetory/addProduct";
import { createInventory, inventory } from "../sellers/invetory/create";
import { outputType } from "./addOutputs";
import { createStockFromOutputType, amountListener } from "./ManageSaves";
import { productDoc } from "./create";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { SellersCollection } from "../firestore/CollectionTyping";

export async function saveDevolution(
  invoiceDoc: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  seletedSeller: DocumentSnapshot<SellersDoc>,
  inventory_outputs: DocumentSnapshot<outputType>[],
  outputs: DocumentSnapshot<outputType>[],
  devoDebounce: number,
  customPrice: number | undefined,
  setRemainStock: Dispatch<SetStateAction<rawOutput[]>>,
  humanAmountChanged: MutableRefObject<boolean>,
  currentDevolution: number
) {
  const allOutputs = [...inventory_outputs, ...[...outputs].reverse()];
  const stock = allOutputs.map((el) =>
    createStockFromOutputType(el.data() as outputType)
  );

  const amountToAmountListener = seletedSeller.data()?.hasInventory
    ? (devoDebounce as number)
    : 0;

  const outputsWorked = amountListener(
    amountToAmountListener,
    stock,
    undefined,
    productDoc as QueryDocumentSnapshot<productDoc>,
    customPrice
  );

  // save sold product
  setRemainStock(outputsWorked.remainingStocks);

  // check if the current devo is the same in the input
  if (devoDebounce === currentDevolution) {
    console.log(
      "devoDebounce is the same as currentDevolution, saving cancelated"
    );

    humanAmountChanged.current = false;

    return false;
  }

  console.log("------- starting to save the DEVOLUTION ========-");
  console.log(
    `Debounced saveDevolution: Attempting to save devo: ${devoDebounce} (Local was ${currentDevolution})`
  );

  // check if a human make the changes
  if (!humanAmountChanged.current) {
    console.log("Human change not detected, saving cancelated");
    return false;
  }
  console.log("Human change detected, saving devolution");

  humanAmountChanged.current = false;
  let inventoryRef: DocumentReference<inventory>;
  const devoFromInvo = invoiceDoc.data()?.devolution;

  // first check in the invoices
  if (devoFromInvo) {
    inventoryRef = devoFromInvo;
  } else {
    // search in the seller coll
    const coll = collection(
      seletedSeller.ref,
      SellersCollection.inventories.root
    ) as CollectionReference<inventory>;
    const q = query(
      coll,
      where("invoice_ref", "==", invoiceDoc.ref),
      where("disabled", "==", false),
      orderBy("created_at", "desc"),
      limit(1)
    );

    const devo = await getDocs(q);

    if (devo.size > 0) {
      inventoryRef = devo.docs[0].ref;
    } else {
      inventoryRef = await createInventory(invoiceDoc.ref, seletedSeller?.ref);
    }
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

  return true;
}
