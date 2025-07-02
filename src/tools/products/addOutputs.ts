import {
  arrayUnion,
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  DocumentSnapshot,
  Timestamp,
  writeBatch,
  WriteBatch,
} from "firebase/firestore";
import { ProductsCollection } from "../firestore/CollectionTyping";
import { productDoc } from "./create";
import { entryDoc } from "./addEntry";
import { invoiceType } from "../invoices/createInvoice";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { defaultCustomPrice } from "../sellers/customPrice/createDefaultCustomPrice";
import { inventory } from "../sellers/invetory/create";

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
  inventory_ref: DocumentReference<inventory> | null;
  default_custom_price_ref: DocumentReference<defaultCustomPrice> | null;
  followed: boolean;
  uid: string;
  disabled: boolean;
};

export const outputParser = ({
  invoice,
  product_doc,
  rawOutput,
}: {
  invoice: DocumentSnapshot<invoiceType>;
  product_doc: DocumentSnapshot<productDoc>;
  rawOutput: rawOutput;
}): outputType => {
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
    uid: "", // Placeholder, will be set on save
    inventory_ref: null,
  };
};

export async function addOutputs({
  invoice,
  product_doc,
  rawOutputs,
  uid,
  outputColl = undefined,
  returnOutputs = false,
  remplaceOutputs = false,
  output_ref = undefined,
  batch: externalBatch,
}: {
  invoice: DocumentSnapshot<invoiceType>;
  product_doc: DocumentSnapshot<productDoc>;
  rawOutputs: rawOutput[];
  uid: string;
  outputColl?: CollectionReference<outputType> | undefined;
  returnOutputs?: boolean;
  remplaceOutputs?: boolean;
  output_ref?: DocumentReference<outputType> | undefined;
  batch?: WriteBatch;
}) {
  const docRef = doc(invoice.ref, "outputs", product_doc.ref.id);
  const normalColl = collection(
    product_doc.ref,
    ProductsCollection.output
  ) as CollectionReference<outputType>;
  const coll = outputColl || normalColl;

  const batch = externalBatch || writeBatch(coll.firestore);

  // if the outputColl isn't undefined, so the outputs don't be reseted
  if (rawOutputs.length === 0 && !outputColl) {
    if (returnOutputs) return [];

    // Usar set con merge para asegurar que el subdocumento exista y su array de outputs se limpie.
    batch.set(docRef, { outputs: [] }, { merge: true });
    if (!externalBatch) {
      await batch.commit();
    }
    return;
  }

  if (!uid) {
    console.error("UID is required to add outputs.");
    throw new Error("User UID not provided for saving outputs.");
  }

  const outputsReady = rawOutputs.map((rawOutput) => ({
    ...outputParser({ invoice, product_doc, rawOutput, output_ref }),
    uid,
  }));

  if (returnOutputs) return outputsReady;

  const createdRefs: DocumentReference<outputType>[] = [];

  for (const output of outputsReady) {
    const newRef = doc(coll); // genera ID automático
    batch.set(newRef, output);
    createdRefs.push(newRef as DocumentReference<outputType>);
  }

  // Solo si no se pasó un outputColl externo, se actualiza la referencia de outputs en el invoice
  if (!outputColl) {
    if (remplaceOutputs) {
      // Esto reemplazará todo el campo 'outputs'.
      // Usar set con merge es más seguro si el subdocumento 'outputs' podría no existir.
      batch.set(docRef, { outputs: createdRefs }, { merge: true });
    } else {
      // Esto agregará los nuevos outputs al array existente.
      batch.set(
        docRef,
        { outputs: arrayUnion(...createdRefs) },
        { merge: true }
      );
    }
  }

  // Solo ejecutar commit si el batch se creó en esta función
  if (!externalBatch) {
    await batch.commit();
  }
}
