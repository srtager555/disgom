import { Firestore } from "@/tools/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { productDoc } from "@/tools/products/create";
import {
  collection,
  CollectionReference,
  DocumentData,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useGetProducts() {
  const [snap, setSnap] = useState<QuerySnapshot<productDoc>>();
  const [docs, setDocs] =
    useState<QueryDocumentSnapshot<productDoc, DocumentData>[]>();

  useEffect(() => {
    const db = Firestore();
    const coll = collection(
      db,
      ProductsCollection.root
    ) as CollectionReference<productDoc>;
    const q = query(coll, where("exclude", "!=", true));

    const unsubcribe = onSnapshot(q, (snap) => {
      setSnap(snap);
      setDocs(snap.docs);
    });

    return function () {
      unsubcribe();
    };
  }, []);

  return { snap, docs };
}
