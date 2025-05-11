import {
  collection,
  CollectionReference,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { ProductsCollection } from "../firestore/CollectionTyping";
import { productDoc } from "./create";
import { Firestore } from "../firestore";

export async function getProducts() {
  const db = Firestore();
  const coll = collection(
    db,
    ProductsCollection.root
  ) as CollectionReference<productDoc>;

  const wheres = [
    where("exclude", "!=", true),
    where("disabled", "==", false),
    orderBy("name"),
  ];

  const q = query(coll, ...wheres);

  return await getDocs(q);
}
