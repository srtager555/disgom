import { DocumentReference, updateDoc } from "firebase/firestore";
import { productDoc } from "./create";

export async function disableProduct(ref: DocumentReference<productDoc>) {
  return await updateDoc(ref, { disabled: true });
}
