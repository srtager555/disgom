import {
  collection,
  DocumentSnapshot,
  getDocs,
  query,
  where,
  writeBatch,
  getFirestore,
} from "firebase/firestore";
import { invoiceType } from "../invoices/createInvoice";
import { productDoc } from "./create";
import { SellersDoc } from "../sellers/create";
import { inventory_output } from "../sellers/invetory/addProduct";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { amountListener, createStockFromOutputType } from "./ManageSaves";
import { getDevolutionInventory } from "./getDevolutionInventoryRef";
import { addInventoryProduct } from "../sellers/invetory/addProduct";
import { outputParser, outputType } from "./addOutputs";
import { SellersCollection } from "../firestore/CollectionTyping";

/**
 * Saves the devolution amount for a product in an invoice.
 * This is a direct, non-debounced function.
 * @param uid The UID of the user performing the action.
 */
export async function saveDevolution(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  seletedSeller: DocumentSnapshot<SellersDoc>,
  inventory_outputs: DocumentSnapshot<inventory_output>[], // from seller inventory
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
  const devolutionInventoryDoc = await getDevolutionInventory(
    invoice,
    seletedSeller
  );

  const devolutionInventoryRef = devolutionInventoryDoc.ref;

  // 2. Disable old devolution outputs for this product in this inventory.
  const coll = collection(
    devolutionInventoryRef,
    SellersCollection.inventories.products
  );
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

  await batch.commit();

  // 3. Combine all stocks (sold items + seller inventory items) to determine what can be returned.
  const soldStocks = rawOutputs.map((raw) =>
    createStockFromOutputType(outputParser(invoice, productDoc, raw))
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
  const devolutionOutputsToSave = devolutionToSave.map((raw) => ({
    ...outputParser(invoice, productDoc, raw),
    inventory_ref: devolutionInventoryRef,
    uid,
    disabled: false,
  }));
  await Promise.all(
    devolutionOutputsToSave.map((devoOutput) =>
      addInventoryProduct(
        devolutionInventoryRef,
        devoOutput as inventory_output
      )
    )
  );

  console.log("Devolution saved successfully.");
}
