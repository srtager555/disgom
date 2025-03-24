import { addDoc, collection, DocumentReference } from "firebase/firestore";
import { inventory } from "./create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { outputType } from "@/tools/products/addOutputs";

export interface inventory_output extends outputType {
  inventory_ref: DocumentReference<inventory>;
}

export async function addInventoryProduct(
  inventory_ref: DocumentReference<inventory>,
  data: inventory_output
) {
  const coll = collection(
    inventory_ref,
    SellersCollection.inventories.products
  );

  return await addDoc(coll, data);
}
