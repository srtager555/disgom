import { addDoc, collection } from "firebase/firestore";
import { Firestore } from "../firestore";
import { SellersCollection } from "../firestore/CollectionTyping";

export type SellerType = {
  name: string;
  hasInventory: boolean;
};

export async function createSeller(name: string, hasInventory: boolean) {
  const db = Firestore();

  const coll = collection(db, SellersCollection.root);

  await addDoc(coll, {
    name,
    hasInventory,
    created_at: new Date(),
  });
}
