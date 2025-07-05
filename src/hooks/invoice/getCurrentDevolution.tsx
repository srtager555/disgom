import { useEffect, useState } from "react";
import { useInvoice } from "@/contexts/InvoiceContext";
import {
  collection,
  CollectionReference,
  doc,
  query,
  where,
  QueryDocumentSnapshot,
  onSnapshot,
  DocumentChange,
} from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import {
  InvoiceCollection,
  ProductsCollection,
} from "@/tools/firestore/CollectionTyping";
import { outputType } from "@/tools/products/addOutputs";

export function useGetCurrentDevolutionByProduct(product_id: string) {
  const { invoice } = useInvoice();
  const [devolutionOutputs, setDevolutionOutputs] = useState<
    QueryDocumentSnapshot<outputType>[]
  >([]);
  const [amount, setAmount] = useState(0);
  const [docsChanges, setDocsChanges] = useState<DocumentChange<outputType>[]>(
    []
  );

  useEffect(() => {
    const db = Firestore();
    const productRef = doc(db, ProductsCollection.root, product_id);

    // console.log("inventory ref in the server", inventoryRef);
    if (!invoice) return;

    const coll = collection(
      invoice.ref,
      InvoiceCollection.inventory
    ) as CollectionReference<outputType>;

    const q = query(
      coll,
      where("product_ref", "==", productRef),
      where("disabled", "==", false)
    );

    const unsubcribe = onSnapshot(q, (snap) => {
      const outputs = snap.docs.map((el) => el.data());
      const amount = outputs.reduce((acc, next) => acc + next.amount, 0);

      setAmount(amount || 0);
      setDevolutionOutputs(snap.docs);
      setDocsChanges(snap.docChanges());
    });

    return () => {
      unsubcribe();
    };
  }, [invoice, product_id]);

  return { amount, outputs: devolutionOutputs, docsChanges };
}
