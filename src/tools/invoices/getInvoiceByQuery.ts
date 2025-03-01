import { doc, getDoc } from "firebase/firestore";
import { Firestore } from "../firestore";
import { InvoiceCollection } from "../firestore/CollectionTyping";
import { DocumentReference } from "firebase/firestore";
import { invoiceType } from "./createInvoice";
import { getQueryParams } from "../getQueryParams";

export async function getInvoiceByQuery() {
  const { id } = getQueryParams();

  if (!id) return;

  const ref = doc(
    Firestore(),
    InvoiceCollection.root,
    id
  ) as DocumentReference<invoiceType>;

  const invoice = await getDoc(ref);

  return invoice;
}
