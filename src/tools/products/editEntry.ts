import {
  arrayRemove,
  arrayUnion,
  DocumentReference,
  updateDoc,
} from "firebase/firestore";
import { productDoc } from "./create";
import { stockProps, stockType } from "./addToStock";

export async function EditEntry(
  product_ref: DocumentReference<productDoc>,
  currentStockData: stockType,
  newStockData: Omit<stockType, "created_at" | "entry_ref">
) {
  const diff = newStockData.amount - currentStockData.amount;
  const newStockamount = currentStockData.amount + diff;

  const newStockToReplace: stockProps & { created_at: Date } = {
    ...newStockData,
    created_at: currentStockData.created_at.toDate(),
    entry_ref: currentStockData.entry_ref,
    amount: newStockamount,
  };

  // udpate the entry
  await updateDoc(currentStockData.entry_ref, {
    amount: newStockData.amount,
  });
  // remove the outdated stock
  await updateDoc(product_ref, {
    stock: arrayRemove(currentStockData),
  });
  // add the new stock
  await updateDoc(product_ref, {
    stock: arrayUnion(newStockToReplace),
  });
}
