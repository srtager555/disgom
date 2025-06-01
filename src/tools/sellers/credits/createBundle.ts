import { invoiceType } from "@/tools/invoices/createInvoice";
import {
  addDoc,
  collection,
  CollectionReference,
  DocumentReference,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";

export type creditBundle = {
  created_at: Timestamp;
  seller_ref: DocumentReference<SellersDoc>;
  invoice_ref: DocumentReference<invoiceType>;
  last_bundle: DocumentReference<creditBundle> | null;
  next_bundle: DocumentReference<creditBundle> | null;
  disabled: boolean; // Campo para marcar el bundle como deshabilitado
};

interface props {
  seller_ref: DocumentReference<SellersDoc>;
  invoice_ref: DocumentReference<invoiceType>;
  previus_bundle_ref: DocumentReference<creditBundle> | null;
}

export async function createCreditBundle({
  seller_ref,
  invoice_ref,
  previus_bundle_ref,
}: props): Promise<DocumentReference<creditBundle>> {
  const coll = collection(
    seller_ref,
    SellersCollection.creditBundles
  ) as CollectionReference<creditBundle>;

  const newBundleData: creditBundle = {
    created_at: Timestamp.fromDate(new Date()),
    seller_ref,
    invoice_ref,
    last_bundle: previus_bundle_ref,
    next_bundle: null,
    disabled: false,
  };

  const newBundleRef = await addDoc(coll, newBundleData);

  // add the bundle to the invoice
  await updateDoc(invoice_ref, {
    credit_bundle_ref: newBundleRef,
  });

  // If there was a previous bundle, update its next_bundle field
  if (previus_bundle_ref) {
    await updateDoc(previus_bundle_ref, {
      next_bundle: newBundleRef,
    });
  }

  return newBundleRef;
}
