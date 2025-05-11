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
  updateDoc,
  where,
} from "firebase/firestore";
import { Firestore } from "../firestore";
import {
  InvoiceCollection,
  SellersCollection,
} from "../firestore/CollectionTyping";
import { SellersDoc } from "../sellers/create";
import { client } from "../sellers/createClient";
import { outputType } from "../products/addOutputs";
import { inventory } from "../sellers/invetory/create";
import { credit } from "../sellers/credits/create";
import { rawMoneyType } from "@/components/pages/invoice/manage/Closing/Money";
import { createAnormalInvoice } from "./createAnormalInvoice";

export type invoiceType = {
  created_at?: Timestamp;
  seller_ref: DocumentReference<SellersDoc>;
  client_ref: DocumentReference<client> | null;
  invoice_type: "normal" | "donation" | "damaged";
  products_outputs: Record<string, Array<DocumentReference<outputType>>>;
  outputs_sold: Record<string, Array<DocumentReference<outputType>>>;
  devolution: DocumentReference<inventory> | null;
  last_inventory_ref: DocumentReference<inventory> | null;
  next_invoice_ref: DocumentReference<invoiceType> | null;
  prev_invoice_ref: DocumentReference<invoiceType> | null;
  total_sold: number;
  total_cost: number;
  total_proft: number;
  route: number | null;
  bills: number;
  money: rawMoneyType;
  refresh_data: Record<string, boolean> | "deleted" | null;
  diff: {
    amount: number;
    paid: boolean;
    paid_at: Timestamp | null;
  };
  credit: {
    paid: boolean;
    paid_at: Timestamp | null;
    due_date: Timestamp;
  } | null;
  newCredits: Record<string, Record<string, DocumentReference<credit>>>;
  disabled: boolean;
  delete_at: Timestamp | null;
};

export async function createInvoice(
  data: Partial<Pick<invoiceType, "seller_ref" | "invoice_type">>,
  fromAnormalInvoiceProcess?: boolean
): Promise<DocumentReference<invoiceType> | undefined> {
  const { seller_ref, invoice_type = "normal" } = data;
  const db = Firestore();
  const coll = collection(
    db,
    InvoiceCollection.root
  ) as CollectionReference<invoiceType>;
  let last_inventory = null;

  if (!fromAnormalInvoiceProcess) {
    if (invoice_type !== "normal" && invoice_type !== undefined) {
      return createAnormalInvoice(invoice_type);
    } else if (seller_ref) {
      const sellerDoc = await getDoc(seller_ref);

      if (sellerDoc.data()?.hasInventory) {
        const coll = collection(
          sellerDoc.ref,
          SellersCollection.inventories.root
        ) as CollectionReference<inventory>;
        const q = query(coll, orderBy("created_at", "desc"), limit(1));
        const inventories = await getDocs(q);

        last_inventory = inventories.docs[0];
      }
    }
  }

  if (!seller_ref) return;

  const queryLastInvoice = query(
    coll,
    orderBy("created_at", "desc"),
    where("disabled", "==", false),
    where("seller_ref", "==", seller_ref),
    limit(1)
  );
  const lastInvoice = await getDocs(queryLastInvoice);

  const newInvoice = await addDoc(coll, {
    created_at: Timestamp.fromDate(new Date()),
    seller_ref,
    client_ref: null,
    products_outputs: {},
    devolution: null,
    outputs_sold: {},
    total_sold: 0,
    total_cost: 0,
    total_proft: 0,
    route: null,
    bills: 0,
    money: {},
    diff: {
      amount: 0,
      paid: false,
      paid_at: null,
    },
    credit: null,
    newCredits: {},
    disabled: false,
    delete_at: null,
    last_inventory_ref: last_inventory?.ref || null,
    next_invoice_ref: null,
    prev_invoice_ref: lastInvoice.docs[0]?.ref || null,
    refresh_data: null,
    invoice_type,
  });

  await updateDoc(lastInvoice.docs[0].ref, {
    next_invoice_ref: newInvoice,
  });

  return newInvoice;
}
