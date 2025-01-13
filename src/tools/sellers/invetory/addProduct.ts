import {
  addDoc,
  collection,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { inventory } from "./create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { productDoc } from "@/tools/products/create";

export type inventory_product_data = {
  amount: number;
  purchase_price: number;
  product_ref: DocumentReference<productDoc>;
};

export interface inventoryProductDoc extends inventory_product_data {
  created_at: Timestamp;
}

export async function addInventoryProduct(
  inventory_ref: DocumentReference<inventory>,
  data: inventory_product_data
) {
  const coll = collection(
    inventory_ref,
    SellersCollection.inventories.products
  );

  return await addDoc(coll, { created_at: new Date(), ...data });
}
