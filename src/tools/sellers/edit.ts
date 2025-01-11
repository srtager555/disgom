import { updateDoc, DocumentReference } from "firebase/firestore";
import { SellerType } from "./create";

export async function editSeller(
  seller_ref: DocumentReference<SellerType>,
  name: string,
  hasInventory: boolean
) {
  await updateDoc(seller_ref, {
    name,
    hasInventory,
  });
}

export async function disableSeller(seller_ref: DocumentReference<SellerType>) {
  await updateDoc(seller_ref, {
    disabled: true,
  });
}
