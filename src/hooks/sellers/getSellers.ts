import { Firestore } from "@/tools/firestore";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { SellersDoc } from "@/tools/sellers/create";
import {
  collection,
  CollectionReference,
  onSnapshot,
  QuerySnapshot,
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

    const unsubcribe = onSnapshot(coll, (snap) => {
      setSellers(snap);
    });

    return () => {
      unsubcribe();
    };
  }, []);

  return sellers;
}
