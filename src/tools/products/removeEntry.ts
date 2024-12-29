import { arrayRemove, DocumentReference, updateDoc } from "firebase/firestore";
import { entryDoc } from "./addEntry";
import { stockType } from "./addToStock";

export async function removeEntry(
  stock: stockType,
  product_ref: DocumentReference<entryDoc>,
  disable: boolean
) {
  // remove stock
  await updateDoc(product_ref, {
    stock: arrayRemove(stock),
  });

  if (!disable) {
    await updateDoc(stock.entry_ref, {
      disabled: true,
    });
  }
}
