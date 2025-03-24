import { useEffect, useState } from "react";
import { useGetInvoiceByQueryOnSnapshot } from "./getInvoiceByQueryOnSnapshot";
import { inventory_output } from "@/tools/sellers/invetory/addProduct";
import {
  collection,
  CollectionReference,
  doc,
  getDocs,
  query,
  where,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";

export function useGetCurrentDevolutionByProduct(product_id: string) {
  const invoice = useGetInvoiceByQueryOnSnapshot();
  const [devolutionOutputs, setDevolutionOutputs] =
    useState<QueryDocumentSnapshot<inventory_output>[]>();
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    async function getDevolutionOutputs() {
      const db = Firestore();
      const data = invoice?.data();
      const inventoryRef = data?.devolution;
      const productRef = doc(db, ProductsCollection.root, product_id);

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

      const invent_products = await getDocs(q);

      const outputs = invent_products.docs.map((el) => el.data());
      const amount = outputs.reduce((acc, next) => acc + next.amount, 0);

      setAmount(amount || 0);
      setDevolutionOutputs(invent_products.docs);
    }

    getDevolutionOutputs();
  }, [invoice, product_id]);

  return { amount, outputs: devolutionOutputs };
}
