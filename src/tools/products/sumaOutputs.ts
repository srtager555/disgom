import {
  DocumentReference,
  DocumentSnapshot,
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { productDoc } from "./create";
import { amountListener, rawOutputToStock } from "./ManageSaves";
import { invoiceType } from "../invoices/createInvoice";
import { outputParser } from "./addOutputs";
import { DocumentWithTheOutputs } from "@/hooks/invoice/getProductOutputsByID";
import { defaultCustomPrice } from "../sellers/customPrice/createDefaultCustomPrice";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { Dispatch, SetStateAction } from "react";
import { debounce } from "lodash";
import { stockType } from "./addToStock";

async function saveNewOutputs(
  productDoc: DocumentSnapshot<productDoc>,
  outputsToCreate: rawOutput[],
  remainingStocks: rawOutput[],
  invoice: DocumentSnapshot<invoiceType>
) {
  const data = productDoc.data();

  // 4. Actualizar el stock del producto con los stocks restantes
  await updateDoc(data?.product_parent || productDoc.ref, {
    stock: remainingStocks.map(rawOutputToStock),
  });

  // 5. Agregar los nuevos outputs a firestore
  const outputsRef = collection(productDoc.ref, "output");
  const newOutputs = await Promise.all(
    outputsToCreate
      .map((el) => {
        return {
          ...el,
          sale_price: data?.stock[0]?.sale_price || el?.sale_price || 0,
        };
      })
      .map(async (output) => {
        const outputParsed = outputParser(invoice, productDoc, output);
        return await addDoc(outputsRef, outputParsed);
      })
  );

  // Guardar las referencia de los outputs a su respectivo documento

  const invoiceProductOutputRef = doc(
    invoice.ref,
    "outputs",
    productDoc.id
  ) as DocumentReference<DocumentWithTheOutputs>;
  console.log(invoiceProductOutputRef.path);

  const currentDoc = await getDoc(invoiceProductOutputRef);
  if (currentDoc.exists()) {
    // update the outputs
    await updateDoc(invoiceProductOutputRef, {
      outputs: arrayUnion(...newOutputs),
    });
  } else {
    // create the doc
    await setDoc(invoiceProductOutputRef, {
      product_ref: productDoc.ref,
      invoice_ref: invoice.ref,
      outputs: newOutputs,
    });
  }
}

const debouceSaveNewOutputs = debounce(saveNewOutputs, 1000);

export async function sumaOutputs(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  amount: number,
  currentAmount: number,
  defaulCustomPrices:
    | DocumentSnapshot<defaultCustomPrice>
    | undefined = undefined,
  parentStock: stockType[],
  setRawOutputs: Dispatch<SetStateAction<rawOutput[]>>,
  customPrice?: number
) {
  const data = productDoc.data();

  // 1. Obtener el stock actual del producto
  const currentStock = data?.product_parent
    ? parentStock
    : productDoc.data()?.stock || [];

  // 2. Calcular la diferencia que necesitamos agregar
  const difference = amount - currentAmount;

  // 3. Usar amountListener para obtener los outputs a crear y el stock restante
  const { outputsToCreate, remainingStocks } = amountListener(
    difference,
    currentStock,
    defaulCustomPrices,
    productDoc,
    customPrice
  );

  // ** save the new outputs to manage the devolution correctly
  setRawOutputs(outputsToCreate);

  debouceSaveNewOutputs(productDoc, outputsToCreate, remainingStocks, invoice);

  console.log("Proceso de suma completado");
}
