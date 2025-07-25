import { Firestore } from "@/tools/firestore";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";
import {
  collection,
  CollectionReference,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useGetSellers() {
  const [sellers, setSellers] = useState<QuerySnapshot<SellersDoc> | undefined>(
    undefined
  );

  useEffect(() => {
    const db = Firestore();
    const coll = collection(
      db,
      SellersCollection.root
    ) as CollectionReference<SellersDoc>;

    const q = query(
      coll,
      where("exclude", "==", false),
      where("disabled", "==", false),
      orderBy("name")
    );

    const unsubcribe = onSnapshot(q, (snap) => {
      setSellers(snap);
    });

    return () => {
      unsubcribe();
    };
  }, []);

  return sellers;
}
