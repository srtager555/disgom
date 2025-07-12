import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { entryDoc } from "@/tools/products/addEntry";
import { productDoc } from "@/tools/products/create";
import {
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

export function useGetEntries(ref: DocumentReference<productDoc> | undefined) {
  const [entries, setEntries] = useState<QueryDocumentSnapshot<entryDoc>[]>();
  const last_ref_id = useRef("");

  useEffect(() => {
    async function getEntries() {
      if (!ref) return;
      if (last_ref_id.current === ref.id) return;

      last_ref_id.current = ref.id;

      const coll = collection(
        ref,
        ProductsCollection.entry
      ) as CollectionReference<entryDoc>;

      const now = new Date();
      const _14DaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const q = query(
        coll,
        where("disabled", "==", false),
        where("created_at", ">=", _14DaysAgo),
        where("created_at", "<=", now)
      );

      const entriesQuery = await getDocs(q);
      setEntries(entriesQuery.docs);
    }

    getEntries();
  }, [ref]);

  return entries;
}
