import { collection, doc, getDocs } from "firebase/firestore";
import { Firestore } from "../firestore";
import { SellersCollection } from "../firestore/CollectionTyping";

export async function getClients(seller_id: string) {
  const db = Firestore();
  const sellerDoc = doc(db, SellersCollection.root, seller_id);
  const coll = collection(sellerDoc, SellersCollection.clients);

  return await getDocs(coll);
}
