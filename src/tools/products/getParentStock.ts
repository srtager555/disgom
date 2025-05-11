import { DocumentReference, getDoc } from "firebase/firestore";
import { productDoc } from "./create";

export async function getParentStock(ref: DocumentReference<productDoc>) {
  const doc = await getDoc(ref);

  return doc.data()?.stock ?? [];
}
