import { useEffect, useState } from "react";
import { useInvoice } from "@/contexts/InvoiceContext";
import { inventory_output } from "@/tools/sellers/invetory/addProduct";
import {
  collection,
  CollectionReference,
  doc,
  query,
  where,
  QueryDocumentSnapshot,
  onSnapshot,
} from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";

export function useGetCurrentDevolutionByProduct(product_id: string) {
  const { invoice } = useInvoice();
  const [devolutionOutputs, setDevolutionOutputs] =
    useState<QueryDocumentSnapshot<inventory_output>[]>();
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const db = Firestore();
    const data = invoice?.data();
    const inventoryRef = data?.devolution;
    const productRef = doc(db, ProductsCollection.root, product_id);

    console.log("inventory ref in the server", inventoryRef);

    if (!inventoryRef) return;
    const coll = collection(
      inventoryRef,
      "products"
    ) as CollectionReference<inventory_output>;

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
    });

    return () => {
      unsubcribe();
    };
  }, [invoice, product_id]);

  return { amount, outputs: devolutionOutputs };
}
