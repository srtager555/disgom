import {
  addDoc,
  collection,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";

export type inventory = {
  created_at: Timestamp;
  inventory_ref: DocumentReference<invoiceType>;
};

export function createInventory(
  invoice_ref: DocumentReference<invoiceType>,
  refSeller: DocumentReference<SellersDoc>
) {
  const collInventories = collection(
    refSeller,
    SellersCollection.inventories.root
  );

  return addDoc(collInventories, {
    created_at: Timestamp.fromDate(new Date()),
    invoice_ref,
  });
}
