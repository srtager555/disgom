import {
  DocumentSnapshot,
  updateDoc,
  Timestamp,
  getFirestore,
} from "firebase/firestore";
import { productDoc } from "./create";
import { addOutputs, outputType } from "./addOutputs";
import { disableOutput } from "./disableOutput";
import { createStockFromOutputType, amountListener } from "./ManageSaves";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { defaultCustomPrice } from "../sellers/customPrice/createDefaultCustomPrice";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { stockType } from "./addToStock";
import { getAuth } from "firebase/auth"; // Import getAuth

async function saveNewOutputs(
  parentStockIsReal: stockType[] | null,
  outputs: DocumentSnapshot<outputType>[],
  invoice: DocumentSnapshot<invoiceType>,
  newStockToSave: rawOutput[],
  newOutputs: rawOutput[], // These are the rawOutputs that will be saved as new outputs
  currentUid: string, // Add currentUid parameter
  productDoc: DocumentSnapshot<productDoc>
) {
  const data = productDoc.data();
  const parentPrice = parentStockIsReal?.[0].sale_price;

  // 6. Deshabilitar outputs anteriores
  await Promise.all(
    outputs.map((doc: DocumentSnapshot<outputType>) => disableOutput(doc.ref))
  );

  // return;
  // 7. Consolidar los stocks basados en entry_ref y precio de venta
  const currentProductStock = parentStockIsReal || data?.stock || [];
  const consolidatedStocks = [...currentProductStock];

  for (const newStock of newStockToSave) {
    const existingStockIndex = consolidatedStocks.findIndex(
      (stock) =>
        stock.entry_ref.path === newStock.entry_ref.path &&
        stock.sale_price === newStock.sale_price
    );

    if (existingStockIndex !== -1) {
      // Si encontramos un stock con el mismo entry_ref y precio de venta, sumamos la cantidad
      consolidatedStocks[existingStockIndex].amount += newStock.amount;
    } else {
      // Si no encontramos un stock con el mismo entry_ref o tiene diferente precio, lo agregamos como nuevo
      consolidatedStocks.push({
        created_at: Timestamp.now(),
        amount: parentPrice || newStock.amount,
        product_ref: newStock.product_ref,
        entry_ref: newStock.entry_ref,
        purchase_price: newStock.purchase_price,
        sale_price: newStock.sale_price,
        seller_commission: newStock.commission,
      });
    }
  }

  // 8. Actualizar el stock del producto con los stocks consolidados
  // si tiene un padre se dara el stock a el
  await updateDoc(data?.product_parent || productDoc.ref, {
    stock: consolidatedStocks,
  });

  // 9. Guardar los nuevos outputs
  await addOutputs(
    invoice,
    productDoc,
    newOutputs,
    undefined,
    false,
    currentUid
  ); // Pass currentUid

  console.log("Proceso de resta completado");
}

export function restaOutputs(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  outputs: DocumentSnapshot<outputType>[],
  defaultCustomPrice: DocumentSnapshot<defaultCustomPrice> | undefined,
  amount: number,
  currentAmount: number,
  parentStock: stockType[],
  setRawOutputs: React.Dispatch<React.SetStateAction<rawOutput[]>>,
  customPrice?: number
) {
  const data = productDoc.data();
  const parentStockIsReal = data?.product_parent ? parentStock : null;

  // 1. Comprobar que amount no sea menor que 0
  const finalAmount = Math.max(0, amount);

  // 4. Convertir outputs a stocks
  const stocks = outputs.map((doc: DocumentSnapshot<outputType>) =>
    createStockFromOutputType(doc.data() as outputType)
  );

  // 5. Calcular la diferencia y usar amountListener
  const difference = currentAmount - finalAmount;
  const { outputsToCreate: newStockToSave, remainingStocks: newOutputs } =
    amountListener(
      difference,
      stocks,
      defaultCustomPrice,
      productDoc,
      customPrice
    );

  // Update the rawOutputs state immediately for UI responsiveness
  setRawOutputs(newOutputs);

  const currentUser = getAuth(getFirestore().app).currentUser;
  const currentUid = currentUser?.uid;
  if (!currentUid) {
    console.error("User not authenticated. Cannot save outputs.");
    return () => {}; // Return a no-op cleanup function
  }

  saveNewOutputs(
    // Call directly, no debounce
    parentStockIsReal,
    outputs,
    invoice,
    newStockToSave,
    newOutputs,
    currentUid, // Pass currentUid
    productDoc
  );

  return () => {}; // No cleanup needed for direct call
}
