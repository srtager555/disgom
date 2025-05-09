import {
  DocumentSnapshot,
  addDoc,
  arrayUnion,
  collection,
  updateDoc,
} from "firebase/firestore";
import { productDoc } from "./create";
import { amountListener, rawOutputToStock } from "./ManageSaves";
import { invoiceType } from "../invoices/createInvoice";
import { outputParser } from "./addOutputs";

export async function sumaOutputs(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  amount: number,
  currentAmount: number,
  customPrice?: number
) {
  // 1. Obtener el stock actual del producto
  const currentStock = productDoc.data()?.stock || [];

  // 2. Calcular la diferencia que necesitamos agregar
  const difference = amount - currentAmount;

  // 3. Usar amountListener para obtener los outputs a crear y el stock restante
  const { outputsToCreate, remainingStocks } = amountListener(
    difference,
    currentStock,
    productDoc,
    customPrice
  );

  // 4. Actualizar el stock del producto con los stocks restantes
  await updateDoc(productDoc.ref, {
    stock: remainingStocks.map(rawOutputToStock),
  });

  // 5. Agregar los nuevos outputs a firestore
  const outputsRef = collection(productDoc.ref, "output");
  const newOutputs = await Promise.all(
    outputsToCreate.map(async (output) => {
      const outputParsed = outputParser(invoice, productDoc, output);
      return await addDoc(outputsRef, outputParsed);
    })
  );

  // 6. Agregar los nuevos outputs al array de products_outputs
  await updateDoc(invoice.ref, {
    [`products_outputs.${productDoc.id}`]: arrayUnion(...newOutputs),
  });

  console.log("Proceso de suma completado");
}
