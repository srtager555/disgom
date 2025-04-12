import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { inventory_output } from "@/tools/sellers/invetory/addProduct";
import { inventory } from "@/tools/sellers/invetory/create";
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
  last_inventory_ref: DocumentReference<inventory> | undefined
) {
  const [inventoriesProducts, setInventoriesProducts] = useState<
    QueryDocumentSnapshot<inventory_output>[]
  >([]);
  const [lastInventoryRef, setlastInventoryRef] = useState<
    DocumentReference<inventory> | undefined
  >(undefined);

  // effect to get the inventory
  useEffect(() => {
    if (isEqual(lastInventoryRef, last_inventory_ref)) return;
    setlastInventoryRef(last_inventory_ref);

    async function getInventory() {
      if (!last_inventory_ref) return;

      const coll = collection(
        last_inventory_ref,
        SellersCollection.inventories.products
      ) as CollectionReference<inventory_output>;

      const q = query(coll, where("disabled", "==", false));
      const invent_products = await getDocs(q);

      setInventoriesProducts(invent_products.docs);
    }

    getInventory();
  }, [last_inventory_ref]);

  return inventoriesProducts;
}
