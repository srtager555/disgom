import { Firestore } from "@/tools/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { productDoc } from "@/tools/products/create";
import {
  collection,
  CollectionReference,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useGetProducts(tag: string = "") {
  const [snap, setSnap] = useState<QuerySnapshot<productDoc>>();
  const [docs, setDocs] =
    useState<QueryDocumentSnapshot<productDoc, DocumentData>[]>();

  useEffect(() => {
    const db = Firestore();
    const coll = collection(
      db,
      ProductsCollection.root
    ) as CollectionReference<productDoc>;
    let q;

    if (tag != "")
      q = query(
        coll,
        where("exclude", "!=", true),
        where("disabled", "==", false),
        where("tags", "array-contains", tag),
        orderBy("name")
      );
    else
      q = query(
        coll,
        where("exclude", "!=", true),
        where("disabled", "==", false),
        orderBy("name")
      );

    const unsubcribe = onSnapshot(q, (snap) => {
      setSnap(snap);
      setDocs(snap.docs);
    });

    return function () {
      unsubcribe();
    };
  }, [tag]);

  return { snap, docs };
}
