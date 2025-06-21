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
  Timestamp,
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
import { Dispatch, SetStateAction } from "react";
import { SellersCollection } from "../firestore/CollectionTyping";
import { debounce } from "lodash";

async function saveNewDevolution(
  invoiceDoc: DocumentSnapshot<invoiceType>,
  selectedSeller: DocumentSnapshot<SellersDoc>,
  productDoc: DocumentSnapshot<productDoc>,
  outputsWorked: { outputsToCreate: rawOutput[]; remainingStocks: rawOutput[] }
) {
  let inventoryRef: DocumentReference<inventory>;
  const devoFromInvo = invoiceDoc.data()?.devolution;

  // first check in the invoices
  if (devoFromInvo) {
    inventoryRef = devoFromInvo;
  } else {
    // search in the seller coll
    const coll = collection(
      selectedSeller.ref,
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
      inventoryRef = await createInventory(invoiceDoc.ref, selectedSeller?.ref);
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
        created_at: Timestamp.fromDate(new Date()),
      } as inventory_output)
  );

  await Promise.all(newInventory);

  await updateDoc(invoiceDoc.ref, {
    devolution: inventoryRef,
  });

  console.log("Devolution saved successfully");
}

const debounceSaveNewDevo = debounce(saveNewDevolution, 1000);

export function saveDevolution(
  invoiceDoc: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  seletedSeller: DocumentSnapshot<SellersDoc>,
  inventory_outputs: DocumentSnapshot<outputType>[],
  outputs: outputType[],
  amountToSave: number,
  customPrice: number | undefined,
  setRemainStock: Dispatch<SetStateAction<rawOutput[]>>
) {
  const inv = inventory_outputs.map((el) => el.data() as outputType);
  const allOutputs = [...inv, ...[...outputs].reverse()];
  const stock = allOutputs.map((el) => createStockFromOutputType(el));

  const amountToAmountListener = seletedSeller.data()?.hasInventory
    ? amountToSave
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

  console.log("------- starting to save the DEVOLUTION ========-");

  try {
    console.log("Waiting to save devolution...");

    debounceSaveNewDevo(invoiceDoc, seletedSeller, productDoc, outputsWorked);

    return () => {
      debounceSaveNewDevo.cancel();
      console.log("Devolution saved canceled");
    };
  } catch (error) {
    console.error("Hubo un error", error);
    return () => {};
  }
}
