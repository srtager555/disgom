import { DocumentSnapshot, getDoc } from "firebase/firestore";
import { productDoc } from "./create";
import { outputType } from "./addOutputs";
import { createStockFromOutputType } from "./ManageSaves";
import { disableOutput } from "./disableOutput";
import { addOutputs } from "./addOutputs";
import { amountListener } from "./ManageSaves";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { defaultCustomPrice } from "../sellers/customPrice/createDefaultCustomPrice";
import { getParentStock } from "./getParentStock";

export async function updatePrice(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  defaulCustomPrices: DocumentSnapshot<defaultCustomPrice> | undefined,
  outputs: DocumentSnapshot<outputType>[],
  amount: number,
  customPrice?: number
) {
  console.log("Solo cambia el precio, actualizando outputs");

  if (outputs.length === 0) {
    console.log("No hay outputs para actualizar");
    return;
  }

  const data = productDoc.data();
  // Obtener los outputs actuales
  const currentProductStocks = data?.product_parent
    ? await getParentStock(data?.product_parent)
    : productDoc.data()?.stock || [];

  // Obtener los documentos de los outputs
  const outputDocs = await Promise.all(
    outputs.map(async (el) => {
      const doc = await getDoc(el.ref);
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
    defaulCustomPrices,
    productDoc,
    newPrice
  );

  // Deshabilitar outputs anteriores
  await Promise.all(
    outputs.map(async (el) => {
      await disableOutput(el.ref);
    })
  );

  // Crear nuevos outputs
  await addOutputs(invoice, productDoc, outputsToCreate);
}
