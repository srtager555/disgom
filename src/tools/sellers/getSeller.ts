import {
  collection,
  CollectionReference,
  doc,
  getDoc,
} from "firebase/firestore";
import { Firestore } from "../firestore";
import { SellersCollection } from "../firestore/CollectionTyping";
import { SellersDoc } from "./create";

export async function getSeller(id: string) {
  const db = Firestore();
  const coll = collection(
    db,
    SellersCollection.root
  ) as CollectionReference<SellersDoc>;
  const sellerRef = doc(coll, id);

  return await getDoc(sellerRef);
}
