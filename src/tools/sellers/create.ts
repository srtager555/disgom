import { addDoc, collection, Timestamp } from "firebase/firestore";
import { Firestore } from "../firestore";
import { SellersCollection } from "../firestore/CollectionTyping";
import { CollectionReference } from "firebase/firestore";
import { invoiceType } from "../invoices/createInvoice";

export type SellerType = {
  name: string;
  hasInventory: boolean;
  disabled: boolean;
  exclude: boolean;
  invoice_type: invoiceType["invoice_type"];
};

export interface SellersDoc extends SellerType {
  created_at: Timestamp;
}

export async function createSeller(
  name: string,
  hasInventory: boolean,
  exclude: boolean = false,
  invoice_type: invoiceType["invoice_type"] = "normal"
) {
  const db = Firestore();

  const coll = collection(
    db,
    SellersCollection.root
  ) as CollectionReference<SellersDoc>;

  return await addDoc(coll, {
    name,
    hasInventory,
    created_at: Timestamp.now(),
    disabled: false,
    exclude,
    invoice_type,
  });
}
