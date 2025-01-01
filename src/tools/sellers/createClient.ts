import { doc, collection, addDoc } from "firebase/firestore";
import { Firestore } from "../firestore";
import { SellersCollection } from "../firestore/CollectionTyping";

export type client = {
  name: string;
  address?: string;
  phone_number?: string;
};

export async function createClient(seller_id: string, data: client) {
  const db = Firestore();
  const sellerDoc = doc(db, SellersCollection.root, seller_id);
  const coll = collection(sellerDoc, SellersCollection.clients);

  return await addDoc(coll, data);
}
