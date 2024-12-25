import { addDoc, collection } from "firebase/firestore";
import { Firestore } from "../firestore";
import { ProductsCollection } from "../firestore/CollectionTyping";

export type productUnits = "LB" | "KG" | "1/4" | "1/2" | "U";

/**
 * A function to create a product
 * @param name
 * @param tags
 * @returns The new product reference
 */
export async function createProduct(
  name: string,
  units: productUnits,
  tags: Array<string>
) {
  const db = Firestore();
  const productColl = collection(db, ProductsCollection.root);

  return await addDoc(productColl, {
    created_at: new Date(),
    name,
    units,
    tags,
  });
}
