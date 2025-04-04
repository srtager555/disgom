import {
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { productDoc } from "./create";
import { outputType } from "./addOutputs";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { disableOutput } from "./disableOutput";
import { returnStock } from "./returnStock";
import {
  createStockFromOutputType,
  amountListener,
  saveNewOutputs,
} from "./ManageSaves";
import { invoiceType } from "@/tools/invoices/createInvoice";

export async function restaOutputs(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: QueryDocumentSnapshot<productDoc>,
  amount: number,
  currentAmount: number,
  customPrice?: number
) {
  // 1. Comprobar que amount no sea menor que 0
  const finalAmount = Math.max(0, amount);

  // 2. Obtener los outputs del producto desde products_outputs
  const productsOutputs = invoice.data()?.products_outputs || {};
  const productOutputs = productsOutputs[productDoc.id] || [];

  // 3. Obtener los documentos de los outputs
  const outputDocs = await Promise.all(
    productOutputs.map((ref: DocumentReference<outputType>) => getDoc(ref))
  );

  // 4. Convertir outputs a stocks
  const stocks = outputDocs.map((doc: DocumentSnapshot<outputType>) =>
    createStockFromOutputType(doc.data() as outputType)
  );

  // 5. Calcular la diferencia y usar amountListener
  const difference = currentAmount - finalAmount;
  const { outputsToCreate, remainingStocks } = amountListener(
    difference,
    stocks,
    productDoc,
    customPrice
  );

  // 6. Deshabilitar outputs anteriores
  await Promise.all(
    outputDocs.map((doc: DocumentSnapshot<outputType>) =>
      disableOutput(doc.ref)
    )
  );

  // 7. Devolver el stock usando returnStock
  await Promise.all(
    outputsToCreate.map((output: rawOutput) =>
      returnStock(productDoc.ref, output)
    )
  );

  // 8. Consolidar los stocks basados en entry_ref y precio de venta
  const currentProductStock = productDoc.data()?.stock || [];
  const consolidatedStocks = [...currentProductStock];

  for (const newStock of remainingStocks) {
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
        amount: newStock.amount,
        product_ref: newStock.product_ref,
        entry_ref: newStock.entry_ref,
        purchase_price: newStock.purchase_price,
        sale_price: newStock.sale_price,
        seller_commission: newStock.commission,
      });
    }
  }

  // 9. Actualizar el stock del producto con los stocks consolidados
  await updateDoc(productDoc.ref, {
    stock: consolidatedStocks,
  });

  // 10. Guardar los nuevos outputs
  await saveNewOutputs(invoice, productDoc, remainingStocks);

  console.log("Proceso de resta completado");
}
