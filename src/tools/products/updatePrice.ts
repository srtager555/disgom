import {
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  getDoc,
} from "firebase/firestore";
import { productDoc } from "./create";
import { outputType } from "./addOutputs";
import { createStockFromOutputType } from "./ManageSaves";
import { disableOutput } from "./disableOutput";
import { addOutputs } from "./addOutputs";
import { amountListener } from "./ManageSaves";
import { invoiceType } from "@/tools/invoices/createInvoice";

export async function updatePrice(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: QueryDocumentSnapshot<productDoc>,
  amount: number,
  customPrice?: number
) {
  console.log("Solo cambia el precio, actualizando outputs");

  // Obtener los outputs actuales
  const productsOutputs = invoice.data()?.products_outputs || {};
  const productOutputs = productsOutputs[productDoc.id] || [];
  const currentProductStocks = productDoc.data()?.stock || [];

  // Obtener los documentos de los outputs
  const outputDocs = await Promise.all(
    productOutputs.map(async (ref: DocumentReference<outputType>) => {
      const doc = await getDoc(ref);
      return doc;
    })
  );

  // Convertir outputs a stocks
  const stocks = outputDocs.map((doc: DocumentSnapshot<outputType>) =>
    createStockFromOutputType(doc.data() as outputType)
  );

  const newPrice = customPrice || currentProductStocks[0].sale_price;

  // Crear nuevos outputs con el nuevo precio
  const { outputsToCreate } = amountListener(
    amount,
    stocks,
    productDoc,
    newPrice
  );

  // Deshabilitar outputs anteriores
  await Promise.all(
    productOutputs.map(async (ref: DocumentReference<outputType>) => {
      await disableOutput(ref);
    })
  );

  // Crear nuevos outputs
  await addOutputs(invoice, productDoc, outputsToCreate);
}
