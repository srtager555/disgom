import {
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  getDoc,
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

export async function restaOutputs(
  invoice: DocumentSnapshot,
  productDoc: QueryDocumentSnapshot<productDoc>,
  amount: number,
  currentAmount: number
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
    productDoc
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

  // 8. Guardar los nuevos outputs
  await saveNewOutputs(invoice.ref, productDoc, remainingStocks);

  console.log("Proceso de resta completado");
}
