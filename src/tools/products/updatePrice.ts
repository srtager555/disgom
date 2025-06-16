import { DocumentSnapshot } from "firebase/firestore";
import { productDoc } from "./create";
import { outputType } from "./addOutputs";
import { createStockFromOutputType } from "./ManageSaves";
import { disableOutput } from "./disableOutput";
import { addOutputs } from "./addOutputs";
import { amountListener } from "./ManageSaves";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { defaultCustomPrice } from "../sellers/customPrice/createDefaultCustomPrice";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { debounce } from "lodash";
import { stockType } from "./addToStock";

async function saveNewOutputs(
  outputs: DocumentSnapshot<outputType>[],
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  outputsToCreate: rawOutput[]
) {
  // Deshabilitar outputs anteriores
  await Promise.all(
    outputs.map(async (el) => {
      await disableOutput(el.ref);
    })
  );

  // Crear nuevos outputs
  await addOutputs(invoice, productDoc, outputsToCreate);
}

const debouceSaveNewOutputs = debounce(saveNewOutputs, 1000);

export async function updatePrice(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  defaulCustomPrices: DocumentSnapshot<defaultCustomPrice> | undefined,
  outputs: DocumentSnapshot<outputType>[],
  amount: number,
  parentStock: stockType[],
  setRawOutputs: React.Dispatch<React.SetStateAction<rawOutput[]>>,
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
    ? parentStock
    : productDoc.data()?.stock || [];

  // Convertir outputs a stocks
  const stocks = outputs.map((doc: DocumentSnapshot<outputType>) =>
    createStockFromOutputType(doc.data() as outputType)
  );

  const newPrice = customPrice || currentProductStocks[0]?.sale_price || 0;

  // Crear nuevos outputs con el nuevo precio
  const { outputsToCreate } = amountListener(
    amount,
    stocks,
    defaulCustomPrices,
    productDoc,
    newPrice
  );

  // Guardar los nuevos outputs
  setRawOutputs(outputsToCreate);

  debouceSaveNewOutputs(outputs, invoice, productDoc, outputsToCreate);
}
