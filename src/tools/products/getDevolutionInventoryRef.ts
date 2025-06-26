import {
  collection,
  CollectionReference,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
} from "firebase/firestore";
import { invoiceType } from "../invoices/createInvoice";
import { SellersDoc } from "../sellers/create";
import { SellersCollection } from "../firestore/CollectionTyping";
import { createInventory, inventory } from "../sellers/invetory/create";

/**
 * Function to get the devolution from the selected invoice
 * @param invoice
 * @param seller
 * @returns The document of the invoice
 */
export async function getDevolutionInventory(
  invoice: DocumentSnapshot<invoiceType>,
  seller: DocumentSnapshot<SellersDoc>
): Promise<QueryDocumentSnapshot<inventory> | DocumentSnapshot<inventory>> {
  // first check if the devolution exist in the invoice
  const devolutionRef = invoice.data()?.devolution;

  if (devolutionRef) {
    const devoDoc = await getDoc(devolutionRef);
    return devoDoc;
  }

  // If the devolution is null in the invoice
  // check if the seller inventory collecion has a inventory refenced to this invoice
  const coll = collection(
    seller.ref,
    SellersCollection.inventories.root
  ) as CollectionReference<inventory>;
  const q = query(coll, where("invoice_ref", "==", invoice.ref), limit(1));
  const snap = await getDocs(q);
  const devo = snap.docs[0];

  if (devo) {
    return devo;
  }

  // create the devolution and add to the invoice
  const newInventoryRef = await createInventory(invoice.ref, seller.ref);

  await updateDoc(invoice.ref, {
    devolution: newInventoryRef,
  });

  const devoDoc = await getDoc(newInventoryRef);
  return devoDoc;
}
