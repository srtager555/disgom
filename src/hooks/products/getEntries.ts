import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { entryDoc } from "@/tools/products/addEntry";
import { productDoc } from "@/tools/products/create";
import { getCurrentTwoWeekRange } from "@/tools/time/current";
import {
  collection,
  CollectionReference,
  DocumentReference,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

export function useGetEntries(ref: DocumentReference<productDoc> | undefined) {
  const [entries, setEntries] = useState<QueryDocumentSnapshot<entryDoc>[]>();
  const last_ref_id = useRef("");

  useEffect(() => {
    if (!ref) return;
    if (last_ref_id.current === ref.id) return;

    last_ref_id.current = ref.id;

    const coll = collection(
      ref,
      ProductsCollection.entry
    ) as CollectionReference<entryDoc>;

    const range = getCurrentTwoWeekRange(new Date());
    const q = query(
      coll,
      where("disabled", "==", false),
      where("created_at", ">=", range.start),
      where("created_at", "<=", range.end)
    );

    const unsubcribe = onSnapshot(q, (entries) => {
      setEntries(entries.docs);
    });

    return () => unsubcribe();
  }, [ref]);

  return entries;
}
