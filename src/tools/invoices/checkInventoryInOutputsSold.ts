import {
  collection,
  DocumentSnapshot,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { invoiceType } from "./createInvoice";
import { SellersCollection } from "../firestore/CollectionTyping";
import { outputType } from "../products/addOutputs";

export async function checkInventoryInOutputsSold(
  invoice: DocumentSnapshot<invoiceType>,
  invOutputs: DocumentSnapshot<outputType>[]
) {
  if (invOutputs.length === 0) return false;

  const devoRef = invoice.data()?.devolution;
  if (!devoRef) return false;

  const coll = collection(devoRef, SellersCollection.inventories.products);
  const outputsRefs = invOutputs.map((el) => el.ref);

  const q = query(
    coll,
    where("output_ref", "in", outputsRefs),
    where("disabled", "==", false)
  );
  const fetch = await getDocs(q);

  const allOutputsAlreadyAdded = invOutputs.every((_) => {
    fetch.docs.filter((el) => el.data().output_ref.id === _.id);
    return fetch.docs.length > 0;
  });

  return allOutputsAlreadyAdded;
}
