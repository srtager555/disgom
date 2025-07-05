import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { outputType } from "@/tools/products/addOutputs";
import {
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { isEqual } from "lodash";
import { useEffect, useState } from "react";

export function useGetAllInventory(
  last_invoice: DocumentReference<invoiceType> | null
) {
  const [inventoriesProducts, setInventoriesProducts] = useState<
    QueryDocumentSnapshot<outputType>[]
  >([]);
  const [lastInventoryRef, setlastInventoryRef] =
    useState<DocumentReference<invoiceType> | null>(null);

  // effect to get the inventory
  useEffect(() => {
    if (isEqual(lastInventoryRef, last_invoice)) return;
    setlastInventoryRef(last_invoice);

    async function getInventory() {
      console.log("!!!!");
      if (!last_invoice) return;
      console.log("?????");

      const coll = collection(
        last_invoice,
        InvoiceCollection.inventory
      ) as CollectionReference<outputType>;

      console.log(coll.path);

      const q = query(coll, where("disabled", "==", false));
      const invent_products = await getDocs(q);

      setInventoriesProducts(invent_products.docs);
    }

    getInventory();
  }, [last_invoice]);

  return inventoriesProducts;
}
