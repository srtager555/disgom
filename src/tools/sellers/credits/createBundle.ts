import { invoiceType } from "@/tools/invoices/createInvoice";
import {
  addDoc,
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
  limit,
  orderBy,
  query,
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
}

export async function createCreditBundle({
  seller_ref,
  invoice_ref,
}: props): Promise<DocumentReference<creditBundle>> {
  const coll = collection(
    seller_ref,
    SellersCollection.creditBundles
  ) as CollectionReference<creditBundle>;

  let last_bundle_ref: DocumentReference<creditBundle> | null = null;

  const q = query(coll, orderBy("created_at", "desc"), limit(1));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    last_bundle_ref = querySnapshot.docs[0]
      .ref as DocumentReference<creditBundle>;
  }

  const newBundleData: creditBundle = {
    created_at: Timestamp.fromDate(new Date()),
    seller_ref,
    invoice_ref,
    last_bundle: last_bundle_ref,
    next_bundle: null,
    disabled: false,
  };

  const newBundleRef = await addDoc(coll, newBundleData);

  // If there was a previous bundle, update its next_bundle field
  if (last_bundle_ref) {
    await updateDoc(last_bundle_ref, {
      next_bundle: newBundleRef,
    });
  }

  return newBundleRef;
}
