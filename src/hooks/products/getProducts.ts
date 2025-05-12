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
  baseWheres: (QueryFieldFilterConstraint | QueryOrderByConstraint)[]
) {
  const db = Firestore();
  const coll = collection(
    db,
    ProductsCollection.root
  ) as CollectionReference<productDoc>;

  const wheres = baseWheres;

  return query(coll, ...wheres);
}

export function useGetProducts(
  order: string = "name",
  orderDirection: "asc" | "desc" = "asc"
) {
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
      orderBy(order, orderDirection),
    ];
    const query = makeReference(wheres);

    const unsubcribe = onSnapshot(query, (snap) => {
      setSnap(snap);
      setDocs(snap.docs);
    });

    return function () {
      unsubcribe();
    };
  }, [order, orderDirection]);

  // effect to the disabled products
  useEffect(() => {
    const wheres = [
      where("exclude", "!=", true),
      where("disabled", "==", true),
      orderBy(order, orderDirection),
    ];
    const query = makeReference(wheres);

    const unsubcribe = onSnapshot(query, (snap) => {
      setDocsDisabled(snap.docs);
    });

    return function () {
      unsubcribe();
    };
  }, [order, orderDirection]);

  // effect to the return only the products withOutParent
  useEffect(() => {
    const wheres = [
      where("exclude", "==", false),
      where("disabled", "==", false),
      where("product_parent", "==", null),
      orderBy(order, orderDirection),
    ];
    const query = makeReference(wheres);

    const unsubcribe = onSnapshot(query, (snap) => {
      setDocsWithoutParent(snap.docs);
    });

    return function () {
      unsubcribe();
    };
  }, [order, orderDirection]);

  // effect to return only the products withParent
  useEffect(() => {
    const wheres = [
      where("exclude", "==", false),
      where("disabled", "==", false),
      where("product_parent", "!=", null),
      orderBy(order, orderDirection),
    ];
    const query = makeReference(wheres);

    const unsubcribe = onSnapshot(query, (snap) => {
      setDocsWithParent(snap.docs);
    });

    return function () {
      unsubcribe();
    };
  }, [order, orderDirection]);

  return { snap, docs, docsDisabled, docsWithParent, docsWithoutParent };
}
