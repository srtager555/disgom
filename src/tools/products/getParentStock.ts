import { DocumentReference } from "firebase/firestore";
import { productDoc } from "./create";
import { getDocFromCacheOnce } from "../firestore/fetch/getDocFromCacheOnce";

export async function getParentStock(ref: DocumentReference<productDoc>) {
  const doc = await getDocFromCacheOnce(ref);

  return doc.data()?.stock ?? [];
}
