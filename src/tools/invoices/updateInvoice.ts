import { collection, doc, updateDoc } from "firebase/firestore";
import { Firestore } from "../firestore";
import { invoiceType } from "./createInvoice";
import { InvoiceCollection } from "../firestore/CollectionTyping";

export async function updateInvoice(
  invoiceid: string,
  data: Partial<invoiceType>
) {
  const db = Firestore();
  const coll = collection(db, InvoiceCollection.root);
  const ref = doc(coll, invoiceid);

  await updateDoc(ref, data);
}
