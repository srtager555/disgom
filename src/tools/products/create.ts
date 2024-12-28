import { addDoc, collection, Timestamp, updateDoc } from "firebase/firestore";
import { Firestore } from "../firestore";
import { ProductsCollection } from "../firestore/CollectionTyping";
import { DocumentReference } from "firebase/firestore";
import { stockType } from "./addToStock";

export type productUnits = "LB" | "KG" | "1/4" | "1/2" | "U";

export type productDoc = {
  name: string;
  created_at: Timestamp;
  units: productUnits;
  tags: string[];
  stock: stockType[];
};

/**
 * A function to create a product
 * @param name
 * @param tags
 * @returns The new product reference
 */
export async function createProduct(
  product_ref: DocumentReference<productDoc> | undefined,
  name: string,
  units: productUnits,
  tags: Array<string>
) {
  if (product_ref) {
    return await updateDoc(product_ref, {
      name,
      units,
      tags,
    });
  }

  const db = Firestore();
  const productColl = collection(db, ProductsCollection.root);

  return await addDoc(productColl, {
    created_at: new Date(),
    name,
    units,
    tags,
    disabled: false,
    exclude: false,
  });
}
