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
  where,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";

export type inventory = {
  created_at: Timestamp;
  invoice_ref: DocumentReference<invoiceType>;
  last_inventory_ref: DocumentReference<inventory> | null;
  disabled: boolean;
};

export async function createInventory(
  invoice_ref: DocumentReference<invoiceType>,
  refSeller: DocumentReference<SellersDoc>
) {
  const collInventories = collection(
    refSeller,
    SellersCollection.inventories.root
  ) as CollectionReference<inventory>;

  const q = query(
    collInventories,
    where("disabled", "==", false),
    orderBy("created_at", "desc"),
    limit(1)
  );
  const last_inventory = await getDocs(q);

  return await addDoc(collInventories, {
    created_at: Timestamp.fromDate(new Date()),
    invoice_ref,
    disabled: false,
    last_inventory_ref: last_inventory.docs[0]?.ref || null,
  });
}
