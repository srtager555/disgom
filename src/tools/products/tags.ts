import { Firestore } from "@/tools/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import {
  collection,
  deleteField,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import styled, { css } from "styled-components";

export const TagComponent = styled.button<{ $bg: string; $hold?: boolean }>`
  position: relative;
  padding: 5px 10px;
  background-color: ${(props) => props.$bg};
  border-radius: 10px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #fff;
  transition: 200ms all ease;
  margin-right: 10px;
  margin-bottom: 10px;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 0%;
    transition: 200ms width ease;
    background-color: #ff000080;
  }

  &:hover {
    transform: scale(1.1);
  }
  &:active {
    transform: scale(0.9);

    ${(props) =>
      props.$hold &&
      css`
        &::before {
          width: 100%;
          transition: 3000ms width ease;
        }
      `}
  }
`;

export type TagType = {
  name: string;
  color: string;
};

export type TagsDoc = {
  tags: Record<string, TagType>;
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

  const d = await getDoc(tagsRef);

  if (!d.exists()) {
    setDoc(tagsRef, {
      tags: {},
    });
  }

  const field = "tags." + name;

  return await updateDoc<TagsDoc, DocumentData>(tagsRef, {
    [field]: {
      name,
      color,
    },
  });
}

export async function deleteTag(name: string) {
  const db = Firestore();
  const coll = collection(db, ProductsCollection.root);
  const tagsRef = doc(
    coll,
    ProductsCollection.tags
  ) as DocumentReference<TagsDoc>;

  const field = "tags." + name;

  return await updateDoc<TagsDoc, DocumentData>(tagsRef, {
    [field]: deleteField(),
  });
}
