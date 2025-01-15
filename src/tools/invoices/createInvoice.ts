import {
  addDoc,
  collection,
  CollectionReference,
  DocumentReference,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { Firestore } from "../firestore";
import {
  InvoiceCollection,
  SellersCollection,
} from "../firestore/CollectionTyping";
import { SellersDoc } from "../sellers/create";
import { client } from "../sellers/createClient";
import { outputType } from "../products/addOutputs";
import { bill } from "@/components/pages/invoice/Product/closing/Bills";

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
  route: number | null;
  bills: Array<bill> | null;
  money: {
    deposit: number;
    cash: number;
  } | null;
  credit: {
    paid: boolean;
    paid_at: Timestamp | null;
  } | null;
};

export async function createInvoice(data: Omit<invoiceType, "created_at">) {
  const db = Firestore();
  const coll = collection(
    db,
    InvoiceCollection.root
  ) as CollectionReference<invoiceType>;

  const sellerDoc = await getDoc(data.seller_ref);
  let last_inventory = null;

  if (sellerDoc.data()?.hasInventory) {
    const coll = collection(sellerDoc.ref, SellersCollection.inventories.root);
    const q = query(coll, orderBy("created_at", "desc"), limit(1));
    const inventories = await getDocs(q);

    last_inventory = inventories.docs[0];
  }

  return await addDoc(coll, {
    created_at: Timestamp.fromDate(new Date()),
    ...data,
    last_inventory_ref: last_inventory?.ref || null,
  });
}
