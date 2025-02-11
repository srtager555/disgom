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
  QueryFieldFilterConstraint,
  QueryOrderByConstraint,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

function makeReference(
  baseWheres: (QueryFieldFilterConstraint | QueryOrderByConstraint)[],
  conditional: boolean,
  conditionalWheres: (QueryFieldFilterConstraint | QueryOrderByConstraint)[]
) {
  const db = Firestore();
  const coll = collection(
    db,
    ProductsCollection.root
  ) as CollectionReference<productDoc>;

  const wheres = baseWheres;

  if (conditional) wheres.push(...conditionalWheres);

  return query(coll, ...wheres);
}

export function useGetProducts(tag: string = "") {
  const [snap, setSnap] = useState<QuerySnapshot<productDoc>>();
  const [docs, setDocs] =
    useState<QueryDocumentSnapshot<productDoc, DocumentData>[]>();
  const [docsDisabled, setDocsDisabled] =
    useState<QueryDocumentSnapshot<productDoc, DocumentData>[]>();
  const [docsWithoutParent, setDocsWithoutParent] =
    useState<QueryDocumentSnapshot<productDoc, DocumentData>[]>();
  const [docsWithParent, setDocsWithParent] =
    useState<QueryDocumentSnapshot<productDoc, DocumentData>[]>();

  // effect to the normal products
  useEffect(() => {
    const wheres = [
      where("exclude", "!=", true),
      where("disabled", "==", false),
      orderBy("name"),
    ];
    const conditionalWheres = [where("tags", "array-contains", tag)];
    const query = makeReference(wheres, tag != "", conditionalWheres);

    const unsubcribe = onSnapshot(query, (snap) => {
      setSnap(snap);
      setDocs(snap.docs);
    });

    return function () {
      unsubcribe();
    };
  }, [tag]);

  // effect to the disabled products
  useEffect(() => {
    const wheres = [
      where("exclude", "!=", true),
      where("disabled", "==", true),
      orderBy("name"),
    ];
    const conditionalWheres = [where("tags", "array-contains", tag)];
    const query = makeReference(wheres, tag != "", conditionalWheres);

    const unsubcribe = onSnapshot(query, (snap) => {
      setDocsDisabled(snap.docs);
    });

    return function () {
      unsubcribe();
    };
  }, [tag]);

  // effect to the return only the products withOutParent
  useEffect(() => {
    const wheres = [
      where("exclude", "==", false),
      where("disabled", "==", false),
      where("product_parent", "==", null),
      orderBy("name"),
    ];
    const query = makeReference(wheres, false, []);

    const unsubcribe = onSnapshot(query, (snap) => {
      setDocsWithoutParent(snap.docs);
    });

    return function () {
      unsubcribe();
    };
  }, []);

  // effect to return only the products withParent
  useEffect(() => {
    const wheres = [
      where("exclude", "==", false),
      where("disabled", "==", false),
      where("product_parent", "!=", null),
      orderBy("name"),
    ];
    const query = makeReference(wheres, false, []);

    const unsubcribe = onSnapshot(query, (snap) => {
      setDocsWithParent(snap.docs);
    });

    return function () {
      unsubcribe();
    };
  }, []);

  return { snap, docs, docsDisabled, docsWithParent, docsWithoutParent };
}
