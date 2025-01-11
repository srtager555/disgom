import { arrayRemove, DocumentReference, updateDoc } from "firebase/firestore";
import { productDoc } from "./create";
import { addToStock, stockProps, stockType } from "./addToStock";

export async function updateStock(
  productRef: DocumentReference<productDoc>,
  stockToRemplace: stockType,
  newStock: stockProps | undefined
) {
  await updateDoc(productRef, {
    stock: arrayRemove(stockToRemplace),
  });

  if (newStock) await addToStock(productRef, newStock);
}
