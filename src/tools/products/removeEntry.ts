import { arrayRemove, DocumentReference, updateDoc } from "firebase/firestore";
import { stockType } from "./addToStock";
import { productDoc } from "./create";

export async function removeEntry(
  stock: stockType,
  product_ref: DocumentReference<productDoc>,
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
