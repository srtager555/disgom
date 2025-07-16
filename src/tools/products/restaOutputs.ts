import {
  DocumentSnapshot,
  Timestamp,
  WriteBatch,
  getFirestore,
  writeBatch,
} from "firebase/firestore";
import { productDoc } from "./create";
import { addOutputs, outputType } from "./addOutputs";
import { createStockFromOutputType, amountListener } from "./ManageSaves";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { defaultCustomPrice } from "../sellers/customPrice/createDefaultCustomPrice";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { stockType } from "./addToStock";
import { getAuth } from "firebase/auth"; // Import getAuth

async function saveNewOutputs(
  exportedBatch: WriteBatch | undefined,
  parentStockIsReal: stockType[] | null,
  productParent: productDoc | undefined,
  outputs: DocumentSnapshot<outputType>[],
  invoice: DocumentSnapshot<invoiceType>,
  newStockToSave: rawOutput[],
  newOutputs: rawOutput[], // These are the rawOutputs that will be saved as new outputs
  currentUid: string, // Add currentUid parameter
  productDoc: DocumentSnapshot<productDoc>
) {
  try {
    const data = productDoc.data();
    console.log("exported batch:", exportedBatch);
    const batch = exportedBatch || writeBatch(productDoc.ref.firestore);

    const persistentPrices = data?.product_parent
      ? productParent?.last_sales_amounts
      : data?.last_sales_amounts;

    const sale_price = persistentPrices?.sale_price;
    const purchase_price = persistentPrices?.purchase_price;
    const commission = persistentPrices?.seller_commission;

    const lastStockAdded = data?.stock[0];

    const salePriceFromCurrentStock = lastStockAdded?.sale_price;
    const purchasePriceFromCurrentStock = lastStockAdded?.purchase_price;
    const commissionFromCurrentStock = lastStockAdded?.seller_commission;

    // 6. Deshabilitar outputs anteriores
    outputs.forEach((doc) => {
      batch.update(doc.ref, { disabled: true });
    });

    // 7. Consolidar los stocks basados en entry_ref y precio de venta
    const currentProductStock = parentStockIsReal || data?.stock || [];
    const consolidatedStocks = [...currentProductStock];

    for (const newStock of newStockToSave) {
      const existingStockIndex = consolidatedStocks.findIndex((stock) => {
        const currentPrice = sale_price || salePriceFromCurrentStock;

        console.log("=======", stock.entry_ref.path, newStock.entry_ref.path);
        console.log("=======", stock.sale_price, currentPrice);

        return (
          stock.entry_ref.path === newStock.entry_ref.path &&
          stock.sale_price === currentPrice
        );
      });

      if (existingStockIndex !== -1) {
        // Si encontramos un stock con el mismo entry_ref y precio de venta, sumamos la cantidad
        consolidatedStocks[existingStockIndex].amount += newStock.amount;
      } else {
        // Si no encontramos un stock con el mismo entry_ref o tiene diferente precio, lo agregamos como nuevo
        consolidatedStocks.push({
          created_at: Timestamp.now(),
          amount: newStock.amount,
          product_ref: newStock.product_ref,
          entry_ref: newStock.entry_ref,
          purchase_price:
            purchase_price ||
            purchasePriceFromCurrentStock ||
            newStock.purchase_price,
          sale_price:
            sale_price || salePriceFromCurrentStock || newStock.sale_price,
          seller_commission:
            commission || commissionFromCurrentStock || newStock.commission,
        });
      }
    }

    // 8. Actualizar el stock del producto con los stocks consolidados
    // si tiene un padre se dara el stock a el
    batch.update(data?.product_parent || productDoc.ref, {
      stock: consolidatedStocks,
    });

    // 9. Guardar los nuevos outputs
    await addOutputs({
      invoice,
      product_doc: productDoc,
      rawOutputs: newOutputs,
      uid: currentUid,
      batch,
      remplaceOutputs: true,
    }); // Pass currentUid

    if (!exportedBatch) {
      console.log("Committing batch", exportedBatch);
      await batch.commit();

      console.log("Proceso de resta completado");
    }
  } catch (error) {
    console.error(
      "ocurrio un error al guardar la consignacion (resta), se cancelo la operacion atomica"
    );
    console.error(error);
  }
}

export function restaOutputs(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  outputs: DocumentSnapshot<outputType>[],
  defaultCustomPrice: DocumentSnapshot<defaultCustomPrice> | undefined,
  amount: number,
  currentAmount: number,
  productParent: productDoc | undefined,
  setRawOutputs: React.Dispatch<React.SetStateAction<rawOutput[]>>,
  exportedBatch: WriteBatch | undefined
) {
  const data = productDoc.data();
  const parentStock = data?.product_parent ? productParent?.stock || [] : null;
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
      undefined
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
    exportedBatch,
    // Call directly, no debounce
    parentStockIsReal,
    productParent,
    outputs,
    invoice,
    newStockToSave,
    newOutputs,
    currentUid, // Pass currentUid
    productDoc
  );

  return () => {}; // No cleanup needed for direct call
}
