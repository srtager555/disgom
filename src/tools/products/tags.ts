import { Firestore } from "@/tools/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import {
  collection,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export type TagsDoc = {
  tags: Record<
    string,
    {
      name: string;
      color: string;
    }
  >;
};

export async function getTags() {
  const db = Firestore();
  const coll = collection(db, ProductsCollection.root);
  const tagsRef = doc(
    coll,
    ProductsCollection.tags
  ) as DocumentReference<TagsDoc>;

  return await getDoc(tagsRef);
}

export async function createTag(name: string, color: string) {
  const db = Firestore();
  const coll = collection(db, ProductsCollection.root);
  const tagsRef = doc(
    coll,
    ProductsCollection.tags
  ) as DocumentReference<TagsDoc>;

  const field = "tags." + name;

  return await updateDoc<TagsDoc, DocumentData>(tagsRef, {
    [field]: {
      name,
      color,
    },
  });
}
