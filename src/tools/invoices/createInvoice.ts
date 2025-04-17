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
import { inventory } from "../sellers/invetory/create";
import { credit } from "../sellers/credits/create";

export type invoiceType = {
  created_at?: Timestamp;
  seller_ref: DocumentReference<SellersDoc>;
  client_ref: DocumentReference<client> | null;
  products_outputs: Record<string, Array<DocumentReference<outputType>>>;
  devolution: DocumentReference<inventory> | null;
  // devolution: {
  //   amount: number | null;
  //   inventory_ref: DocumentReference<inventory> | null;
  // };
  outputs_sold: Record<string, Array<DocumentReference<outputType>>>;
  // inventory_ref: null;
  last_inventory_ref: DocumentReference<inventory> | null;
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
  newCredits: Array<DocumentReference<credit>>;
  disabled: boolean;
};

export async function createInvoice(data: Pick<invoiceType, "seller_ref">) {
  const { seller_ref } = data;
  const db = Firestore();
  const coll = collection(
    db,
    InvoiceCollection.root
  ) as CollectionReference<invoiceType>;

  const sellerDoc = await getDoc(seller_ref);
  let last_inventory = null;

  if (sellerDoc.data()?.hasInventory) {
    const coll = collection(
      sellerDoc.ref,
      SellersCollection.inventories.root
    ) as CollectionReference<inventory>;
    const q = query(coll, orderBy("created_at", "desc"), limit(1));
    const inventories = await getDocs(q);

    last_inventory = inventories.docs[0];
  }

  return await addDoc(coll, {
    created_at: Timestamp.fromDate(new Date()),
    seller_ref,
    client_ref: null,
    products_outputs: {},
    devolution: null,
    outputs_sold: {},
    total_sold: {
      normal: 0,
      withInventory: 0,
    },
    total_cost: {
      normal: 0,
      withInventory: 0,
    },
    total_proft: {
      normal: 0,
      withInventory: 0,
    },
    route: null,
    bills: null,
    money: null,
    credit: null,
    newCredits: [],
    disabled: false,
    last_inventory_ref: last_inventory?.ref || null,
  });
}
