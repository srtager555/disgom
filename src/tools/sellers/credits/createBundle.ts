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
  bundle_container_ref: DocumentReference<creditBundleContainerDoc>;
  disabled: boolean; // Campo para marcar el bundle como deshabilitado
};

interface creditBundleprops {
  seller_ref: DocumentReference<SellersDoc>;
  invoice_ref: DocumentReference<invoiceType>;
  previus_bundle_ref: DocumentReference<creditBundle> | null;
  bundle_container_ref: DocumentReference<creditBundleContainerDoc>;
}

export interface creditBundleContainerDoc {
  disabled: boolean;
  created_at: Timestamp;
  seller_ref: DocumentReference<SellersDoc>;
}

export async function createCreditBundleContainer(
  seller_ref: DocumentReference<SellersDoc>
): Promise<DocumentReference<creditBundleContainerDoc>> {
  return await addDoc(
    collection(
      seller_ref,
      SellersCollection.creditBundles.root
    ) as CollectionReference<creditBundleContainerDoc>,
    {
      disabled: false,
      created_at: Timestamp.fromDate(new Date()),
      seller_ref,
    }
  );
}

export async function createCreditBundle({
  seller_ref,
  invoice_ref,
  previus_bundle_ref,
  bundle_container_ref,
}: creditBundleprops): Promise<DocumentReference<creditBundle>> {
  const coll = collection(
    bundle_container_ref,
    SellersCollection.creditBundles.bundles.root
  ) as CollectionReference<creditBundle>;

  const newBundleData: creditBundle = {
    created_at: Timestamp.fromDate(new Date()),
    seller_ref,
    invoice_ref,
    bundle_container_ref,
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
