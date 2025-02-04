import { Firestore } from "@/tools/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { Tag, TagsDoc } from "@/tools/products/tags";
import { doc, DocumentReference, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";

export function useGetTags() {
  const [tags, setTags] = useState<Tag | undefined>(undefined);

  useEffect(() => {
    const db = Firestore();
    const ref = doc(
      db,
      ProductsCollection.root,
      ProductsCollection.tags
    ) as DocumentReference<TagsDoc>;

    const unsubcribe = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (data) setTags(data.tags);
    });

    return function () {
      unsubcribe();
    };
  }, []);

  return tags;
}
