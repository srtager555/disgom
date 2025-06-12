import { useEffect, useRef, useState } from "react";
import { outputType } from "@/tools/products/addOutputs";
import {
  collection,
  CollectionReference,
  DocumentReference,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { getCurrentTwoWeekRange } from "@/tools/time/current";

export function useGetProductOutputs(
  ref: DocumentReference<productDoc> | undefined
) {
  const [outputs, setOutputs] = useState<
    Array<QueryDocumentSnapshot<outputType>>
  >([]);
  const last_ref_id = useRef("");

  useEffect(() => {
    if (!ref) return;
    if (last_ref_id.current === ref.id) return;

    last_ref_id.current = ref.id;

    const coll = collection(
      ref,
      ProductsCollection.output
    ) as CollectionReference<outputType>;
    const range = getCurrentTwoWeekRange(new Date());
    const q = query(
      coll,
      where("disabled", "==", false),
      where("created_at", ">=", range.start),
      where("created_at", "<=", range.end)
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      setOutputs(snap.docs);
    });

    return () => unsubscribe();
  }, [ref]);

  return outputs;
}
