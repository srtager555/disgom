import { arrayUnion, DocumentReference, updateDoc } from "firebase/firestore";
import { productDoc } from "./create";
import { entryData, entryDoc } from "./addEntry";

interface stockProps extends entryData {
  entry_ref: DocumentReference<entryDoc>;
}

export async function addToStock(
  product_ref: DocumentReference<productDoc>,
  data: stockProps
) {
  await updateDoc(product_ref, {
    stock: arrayUnion({ created_at: new Date(), ...data }),
  });
}
