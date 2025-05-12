import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  DocumentSnapshot,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { ProductsCollection } from "../firestore/CollectionTyping";
import { productDoc } from "./create";
import { entryDoc } from "./addEntry";
import { invoiceType } from "../invoices/createInvoice";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { defaultCustomPrice } from "../sellers/customPrice/createDefaultCustomPrice";

export type outputType = {
  created_at: Timestamp;
  amount: number;
  purchase_price: number;
  purchase_value: number;
  sale_price: number;
  sale_value: number;
  commission: number;
  commission_value: number;
  entry_ref: DocumentReference<entryDoc>;
  invoice_ref: DocumentReference<invoiceType>;
  product_ref: DocumentReference<productDoc>;
  default_custom_price_ref: DocumentReference<defaultCustomPrice> | null;
  followed: boolean;
  disabled: boolean;
};

export const outputParser = (
  invoice: DocumentSnapshot<invoiceType>,
  product_doc: DocumentSnapshot<productDoc>,
  rawOutput: rawOutput
): outputType => {
  const purchase_value = rawOutput.amount * rawOutput.purchase_price;
  const sale_value = rawOutput.amount * rawOutput.sale_price;
  const commission_value = rawOutput.amount * rawOutput.commission;

  return {
    created_at: Timestamp.fromDate(new Date()),
    amount: rawOutput.amount,
    purchase_price: rawOutput.purchase_price,
    purchase_value,
    sale_price: rawOutput.sale_price,
    sale_value,
    default_custom_price_ref: rawOutput.default_custom_price_ref,
    commission: rawOutput.commission,
    commission_value,
    entry_ref: rawOutput.entry_ref,
    invoice_ref: invoice.ref,
    product_ref: product_doc.ref,
    disabled: false,
    followed: product_doc.data()?.followed || false,
  };
};

export async function addOutputs(
  invoice: DocumentSnapshot<invoiceType>,
  product_doc: DocumentSnapshot<productDoc>,
  rawOutputs: rawOutput[],
  outputColl: CollectionReference<outputType> | undefined = undefined,
  returnOutputs: boolean = false
) {
  const docRef = doc(invoice.ref, "outputs", product_doc.ref.id);
  const normalColl = collection(
    product_doc.ref,
    ProductsCollection.output
  ) as CollectionReference<outputType>;
  const coll = outputColl || normalColl;

  if (rawOutputs.length === 0) {
    if (returnOutputs) return [];

    await updateDoc(docRef, {
      outputs: [],
    });

    return;
  }

  const outputsReady = rawOutputs.map((el) =>
    outputParser(invoice, product_doc, el)
  );

  if (returnOutputs) return outputsReady;

  const batch = writeBatch(coll.firestore);
  const createdRefs: { ref: ReturnType<typeof doc>; data: outputType }[] = [];

  try {
    for (const output of outputsReady) {
      const newRef = doc(coll); // genera ID automático
      batch.set(newRef, output);
      createdRefs.push({ ref: newRef, data: output });
    }

    await batch.commit();

    // Solo si no se pasó un outputColl externo, se actualiza la referencia de outputs en el invoice
    if (!outputColl) {
      await updateDoc(docRef, {
        outputs: createdRefs.map((entry) => entry.ref),
      });
    }
  } catch (error) {
    console.error("Error al procesar el batch de outputs:", error);
    throw new Error("No se pudieron guardar los outputs. Intenta de nuevo.");
  }
}
