import {
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { createInvoice, invoiceType } from "./createInvoice";
import { Firestore } from "../firestore";
import { SellersCollection } from "../firestore/CollectionTyping";
import { createSeller, SellersDoc } from "../sellers/create";

export async function createAnormalInvoice(
  invoice_type: invoiceType["invoice_type"]
) {
  let seller_ref: DocumentReference<SellersDoc> | null = null;
  const db = Firestore();
  const collSellers = collection(
    db,
    SellersCollection.root
  ) as CollectionReference<SellersDoc>;
  const q = query(collSellers, where("invoice_type", "==", invoice_type));
  const result = await getDocs(q);

  if (result.size === 0) {
    seller_ref = await createSeller("No aplica", false, true, invoice_type);
  } else {
    seller_ref = result.docs[0].ref;
  }

  if (!seller_ref) return;

  return createInvoice({ seller_ref, invoice_type }, true);
}
