import {
  addDoc,
  collection,
  CollectionReference,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { Firestore } from "../firestore";
import { InvoiceCollection } from "../firestore/CollectionTyping";
import { SellersDoc, SellerType } from "../sellers/create";
import { client } from "../sellers/createClient";
import { outputType } from "../products/addOutputs";

export type invoiceType = {
  created_at: Timestamp;
  seller_ref: DocumentReference<SellersDoc>;
  client_ref: DocumentReference<client> | null;
  products_outputs: Array<DocumentReference<outputType>> | null;
  inventory_ref: null;
  last_inventory_ref: null;
  total_sold: {
    normal: number;
    withInventory: number;
  };
  total_cost: {
    normal: number;
    withInventory: number;
  };
  total_proft: {
    normal: number;
    withInventory: number;
  };
  credit: {
    paid: boolean;
    paid_at: Timestamp | null;
  } | null;
};

export async function createInvoice() {
  const db = Firestore();
  const coll = collection(
    db,
    InvoiceCollection.root
  ) as CollectionReference<invoiceType>;

  await addDoc(coll, {
    created_at: Timestamp.fromDate(new Date()),
  });
}
