import {
  collection,
  DocumentSnapshot,
  getDocs,
  query,
  where,
  writeBatch,
  getFirestore,
  doc,
} from "firebase/firestore";
import { invoiceType } from "../invoices/createInvoice";
import { productDoc } from "./create";
import { SellersDoc } from "../sellers/create";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { amountListener, createStockFromOutputType } from "./ManageSaves";
import { outputParser, outputType } from "./addOutputs";
import { InvoiceCollection } from "../firestore/CollectionTyping";

/**
 * Saves the devolution amount for a product in an invoice.
 * This is a direct, non-debounced function.
 * @param uid The UID of the user performing the action.
 */
export async function saveDevolution(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  seletedSeller: DocumentSnapshot<SellersDoc>,
  inventory_outputs: DocumentSnapshot<outputType>[], // from seller inventory
  rawOutputs: rawOutput[], // from current invoice sale
  amountToSave: number,
  customPrice: number | undefined,
  uid: string
) {
  if (!seletedSeller.data()?.hasInventory) {
    console.log("Seller does not have inventory, skipping devolution save.");
    return;
  }

  // 1. Get or create the devolution inventory reference for this invoice.
  // const devolutionInventoryDoc = await getDevolutionInventory(
  //   invoice,
  //   seletedSeller
  // );

  // const devolutionInventoryRef = devolutionInventoryDoc.ref;

  // 2. Disable old devolution outputs for this product in this inventory.
  const coll = collection(invoice.ref, InvoiceCollection.inventory);
  const oldDevolutionOutputsQuery = query(
    coll,
    where("product_ref", "==", productDoc.ref),
    where("disabled", "==", false)
  );

  const oldDevolutionOutputsSnap = await getDocs(oldDevolutionOutputsQuery);
  const batch = writeBatch(getFirestore());

  oldDevolutionOutputsSnap.forEach((doc) => {
    batch.update(doc.ref, { disabled: true });
  });

  // 3. Combine all stocks (sold items + seller inventory items) to determine what can be returned.
  const soldStocks = rawOutputs.map((rawOutput) =>
    createStockFromOutputType(
      outputParser({ invoice, product_doc: productDoc, rawOutput })
    )
  );
  const inventoryStocks = inventory_outputs.map((invDoc) =>
    createStockFromOutputType(invDoc.data() as outputType)
  );
  const combinedStocks = [...soldStocks, ...inventoryStocks];

  // 4. Use amountListener to calculate which items are being returned.
  const { outputsToCreate: devolutionToSave } = amountListener(
    amountToSave,
    combinedStocks,
    undefined,
    productDoc,
    customPrice
  );

  // 5. Save the new devolution outputs.
  const devolutionOutputsToSave = devolutionToSave.map((rawOutput) => ({
    ...outputParser({ invoice, product_doc: productDoc, rawOutput }),
    uid,
    disabled: false,
  }));

  devolutionOutputsToSave.forEach((devoOutput) => {
    // La colección ya fue definida arriba, la reutilizamos.
    const newDocRef = doc(coll);
    batch.set(newDocRef, devoOutput as outputType);
  });

  await batch.commit();

  console.log("Devolution saved successfully.");
}
